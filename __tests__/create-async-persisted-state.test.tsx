import { createAsyncPersistedState } from '../src'
import { local as storage } from '../src/storages/browser-storage'
import React, { Suspense, startTransition } from 'react'
import { renderHook, cleanup, act, render, screen, waitFor } from '@testing-library/react'
import type { AsyncStorage, StorageChange, StorageChangeListener } from '../src/@types/storage'

const [usePersistedState, clear] = createAsyncPersistedState('test', storage)

type DeferredResolve = () => void

/**
 * An `AsyncStorage` backed by a plain object, so the async hook can be driven
 * without depending on how the extension mock schedules its promises.
 * `deferredReads` holds back that many leading `get` calls until `releaseReads`
 * is called, which is how a slow backend is reproduced. Deferring only the
 * leading reads keeps the setter's own read fast, so a late load cannot be
 * masked by the change event the setter's write emits. `stored` is the backing
 * object itself, so a case can read what actually reached storage.
 */
function createFakeAsyncStorage(entries: { [key: string]: string } = {}, deferredReads = 0) {
  const stored: { [key: string]: string } = { ...entries }
  const listeners = new Set<StorageChangeListener>()
  const pendingReads: DeferredResolve[] = []
  let readCount = 0

  const fire = (changes: { [key: string]: StorageChange }): void => {
    for (const listener of [...listeners]) {
      listener(changes)
    }
  }
  const toKeyList = (keys: string | string[]): string[] => (Array.isArray(keys) ? keys : [keys])
  const get = jest.fn(async (keys: string | string[]) => {
    const result: { [key: string]: string } = {}

    for (const key of toKeyList(keys)) {
      if (key in stored) result[key] = stored[key]
    }

    readCount += 1

    // A slow backend settles with what it read when the call was made, not with
    // whatever the storage holds by the time the promise resolves.
    if (readCount <= deferredReads) {
      await new Promise<void>(resolve => {
        pendingReads.push(resolve)
      })
    }

    return result
  })
  const set = jest.fn(async (items: { [key: string]: string }) => {
    const changes: { [key: string]: StorageChange } = {}

    for (const [key, value] of Object.entries(items)) {
      changes[key] = { oldValue: stored[key] ?? null, newValue: value }
      stored[key] = value
    }

    fire(changes)
  })
  const remove = jest.fn(async (keys: string | string[]) => {
    const changes: { [key: string]: StorageChange } = {}

    for (const key of toKeyList(keys)) {
      // As the bundled adapters do: a key that held nothing is not reported removed.
      if (!(key in stored)) continue

      changes[key] = { oldValue: stored[key], newValue: null }
      delete stored[key]
    }

    if (Object.keys(changes).length > 0) fire(changes)
  })
  const asyncStorage: AsyncStorage = {
    get,
    set,
    remove,
    onChanged: {
      addListener: listener => {
        listeners.add(listener)
      },
      removeListener: listener => {
        listeners.delete(listener)
      },
      hasListener: listener => listeners.has(listener),
    },
  }
  const releaseReads = (): void => {
    while (pendingReads.length > 0) {
      pendingReads.shift()?.()
    }
  }

  return { asyncStorage, get, set, remove, releaseReads, stored }
}

describe('hook defined correctly', () => {
  // Awaited, or the removal settles inside the next test and fires a change
  // event at whatever listener that test has registered by then.
  beforeEach(async () => {
    cleanup()
    await clear()
    localStorage.clear()
  })

  test('is callable', async () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))

    expect(usePersistedState).toBeDefined()
    expect(clear).toBeDefined()
    expect(result.current).toBeDefined()

    // The mount effect reads storage asynchronously. Without draining it first, a
    // write awaited inside that effect would land after the assertion below and
    // pass unseen.
    await act(async () => {})

    expect(browser.storage.local.set).not.toHaveBeenCalled()

    await act(async () => {
      await result.current[1]('baz')
    })

    // Keeps the negative assertion above honest: a dead write path would satisfy
    // it exactly as well as rendering-writes-nothing does.
    expect(browser.storage.local.set).toHaveBeenCalledTimes(1)
  })

  test('localstorage called correctly', async () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))
    const expected = JSON.stringify({ foo: 'baz' })

    act(() => {
      result.current[1]('baz')
    })

    await waitFor(() =>
      expect(browser.storage.local.set).toHaveBeenLastCalledWith({ 'persisted_state_hook:test': expected }),
    )
  })
})

describe('reference initial values', () => {
  test('does not re-render endlessly when initialValue is an inline object and a value is already persisted', async () => {
    const { asyncStorage, get } = createFakeAsyncStorage({
      'persisted_state_hook:loop': JSON.stringify({ inlineObject: { count: 1 } }),
    })
    const [useLoopPersistedState] = createAsyncPersistedState('loop', asyncStorage)

    // With the defect present the load effect re-runs on every render, so the
    // run is capped by an explicit render budget instead of hanging jest.
    const renderBudget = 60
    let renders = 0

    const { result } = renderHook(() => {
      renders += 1

      if (renders > renderBudget) {
        throw new Error(`exceeded render budget of ${renderBudget}: infinite render loop`)
      }

      return useLoopPersistedState('inlineObject', { count: 0 })
    })

    await waitFor(() => expect(result.current[0]).toEqual({ count: 1 }))

    expect(get).toHaveBeenCalledTimes(1)
  })
})

describe('functional updates', () => {
  test('persists every functional update queued in one batch', async () => {
    const { asyncStorage, stored } = createFakeAsyncStorage()
    const [useCountPersistedState] = createAsyncPersistedState('updates', asyncStorage)
    const { result } = renderHook(() => useCountPersistedState('count', 0))

    await act(async () => {
      const first = result.current[1](previous => previous + 1)
      const second = result.current[1](previous => previous + 1)

      await Promise.all([first, second])
    })

    expect(result.current[0]).toBe(2)
    expect(JSON.parse(stored['persisted_state_hook:updates'])).toEqual({ count: 2 })
  })
})

describe('mount order', () => {
  test('subscribes before it reads, leaving no interval a write can fall into', async () => {
    const { asyncStorage } = createFakeAsyncStorage()
    const order: string[] = []
    const tracedStorage: AsyncStorage = {
      ...asyncStorage,
      get: keys => {
        order.push('read')

        return asyncStorage.get(keys)
      },
      onChanged: {
        ...asyncStorage.onChanged,
        addListener: listener => {
          order.push('addListener')
          asyncStorage.onChanged.addListener(listener)
        },
      },
    }
    const [useTracedPersistedState] = createAsyncPersistedState('order', tracedStorage)

    await act(async () => {
      renderHook(() => useTracedPersistedState('foo', 'initial'))
    })

    // Reading first leaves the interval between the read and the subscription:
    // a write landing there is in neither, and is lost. Reading last removes it,
    // because the read covers everything before the subscription began.
    expect(order).toEqual(['addListener', 'read'])
  })
})

describe('changing key', () => {
  test('keeps the committed key initial value while a new key render is suspended', async () => {
    const { asyncStorage, releaseReads } = createFakeAsyncStorage(
      { 'persisted_state_hook:suspendedKey': JSON.stringify({ unrelated: 'persisted' }) },
      1,
    )
    const [useKeyedPersistedState] = createAsyncPersistedState('suspendedKey', asyncStorage)
    let isSecondRenderPending = true
    let releaseSecondRender: DeferredResolve = () => undefined
    const secondRenderPending = new Promise<void>(resolve => {
      releaseSecondRender = () => {
        isSecondRenderPending = false
        resolve()
      }
    })
    const KeyedState = ({ itemKey, initialValue }: { itemKey: string; initialValue: string }) => {
      const [value] = useKeyedPersistedState(itemKey, initialValue)

      if (itemKey === 'second' && isSecondRenderPending) throw secondRenderPending

      return <div role="status">{`${itemKey}:${value}`}</div>
    }
    const { rerender } = render(
      <Suspense fallback="loading">
        <KeyedState itemKey="first" initialValue="initial-first" />
      </Suspense>,
    )

    expect(screen.getByRole('status').textContent).toBe('first:initial-first')

    act(() => {
      startTransition(() => {
        rerender(
          <Suspense fallback="loading">
            <KeyedState itemKey="second" initialValue="initial-second" />
          </Suspense>,
        )
      })
    })

    expect(screen.getByRole('status').textContent).toBe('first:initial-first')

    try {
      await act(async () => {
        releaseReads()
      })

      expect(screen.getByRole('status').textContent).toBe('first:initial-first')

      await act(async () => {
        await asyncStorage.remove('persisted_state_hook:suspendedKey')
      })

      expect(screen.getByRole('status').textContent).toBe('first:initial-first')
    } finally {
      await act(async () => {
        releaseSecondRender()
      })
    }
  })

  test('ignores a load left in flight by the previous key', async () => {
    const { asyncStorage, releaseReads } = createFakeAsyncStorage(
      { 'persisted_state_hook:keys': JSON.stringify({ first: 'value-first', second: 'value-second' }) },
      2,
    )
    const [useKeyedPersistedState] = createAsyncPersistedState('keys', asyncStorage)

    const { result, rerender } = renderHook(({ itemKey }) => useKeyedPersistedState(itemKey, 'initial'), {
      initialProps: { itemKey: 'first' },
    })

    rerender({ itemKey: 'second' })

    // Both loads are in flight and the one started for the abandoned key settles
    // first, which is the order that lets a stale read win.
    await act(async () => {
      releaseReads()
    })

    expect(result.current[0]).toBe('value-second')
  })

  test('loads the new key after the previous one has already applied a value', async () => {
    const { asyncStorage } = createFakeAsyncStorage({
      'persisted_state_hook:appliedKeys': JSON.stringify({ first: 'value-first', second: 'value-second' }),
    })
    const [useKeyedPersistedState] = createAsyncPersistedState('appliedKeys', asyncStorage)

    const { result, rerender } = renderHook(({ itemKey }) => useKeyedPersistedState(itemKey, 'initial'), {
      initialProps: { itemKey: 'first' },
    })

    await act(async () => {})

    // The load for the first key has applied, which is the state the second load has to be able
    // to overrule. The flag that stops a late load reverting a value the caller set belongs to
    // the key it was raised for; carried across, it shuts the new key's load out for good and the
    // hook shows the previous key's value under the new key.
    expect(result.current[0]).toBe('value-first')

    rerender({ itemKey: 'second' })

    await act(async () => {})

    expect(result.current[0]).toBe('value-second')
  })

  test('uses the new key initial value when no value is persisted', async () => {
    const { asyncStorage } = createFakeAsyncStorage({
      'persisted_state_hook:keyInitialValues': JSON.stringify({ first: 'persisted-first' }),
    })
    const [useKeyedPersistedState] = createAsyncPersistedState('keyInitialValues', asyncStorage)
    const { result, rerender } = renderHook(
      ({ itemKey, initialValue }) => useKeyedPersistedState(itemKey, initialValue),
      {
        initialProps: { itemKey: 'first', initialValue: 'initial-first' },
      },
    )

    await waitFor(() => expect(result.current[0]).toBe('persisted-first'))

    rerender({ itemKey: 'second', initialValue: 'initial-second' })

    await waitFor(() => expect(result.current[0]).toBe('initial-second'))
  })
})

describe('setter identity', () => {
  test('survives a write made through it', async () => {
    const { asyncStorage } = createFakeAsyncStorage()
    const [useIdentityPersistedState] = createAsyncPersistedState('identity', asyncStorage)
    const { result } = renderHook(() => useIdentityPersistedState('written', 'initial'))
    const setterBeforeWrite = result.current[1]

    await act(async () => {
      await result.current[1]('written value')
    })

    // The write has to have happened, or the identity below holds for the wrong
    // reason.
    expect(result.current[0]).toBe('written value')

    // Resolving updates against the state instead of the ref would put it in the
    // dependencies, and every write would hand consumers a new setter.
    expect(result.current[1]).toBe(setterBeforeWrite)
  })
})

describe('pending loads', () => {
  test('does not overwrite a value set before the initial load resolved', async () => {
    const { asyncStorage, releaseReads } = createFakeAsyncStorage(
      { 'persisted_state_hook:slow': JSON.stringify({ foo: 'persisted' }) },
      1,
    )
    const [useSlowPersistedState] = createAsyncPersistedState('slow', asyncStorage)
    const { result } = renderHook(() => useSlowPersistedState('foo', 'initial'))

    await act(async () => {
      result.current[1]('set by the user')
    })

    await act(async () => {
      releaseReads()
    })

    expect(result.current[0]).toBe('set by the user')
  })
})

describe('a backend that fails the read', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    cleanup()
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('reports the failure and mounts on the initial value', async () => {
    const failingStorage: AsyncStorage = {
      get: jest.fn(() => Promise.reject(new Error('storage unavailable'))),
      set: jest.fn(async () => undefined),
      remove: jest.fn(async () => undefined),
      onChanged: {
        addListener: () => undefined,
        removeListener: () => undefined,
        hasListener: () => false,
      },
    }
    const [useFailingPersistedState] = createAsyncPersistedState('failing', failingStorage)
    const { result } = renderHook(() => useFailingPersistedState('foo', 'initial'))

    await act(async () => {})

    // An extension backend rejects on a quota error or an invalidated context.
    // Left unclaimed the rejection terminates the process on Node 15+, and the
    // sync path reports its failures rather than dropping them. Asserting the
    // library's own message keeps React's logging from satisfying this.
    expect(consoleError).toHaveBeenCalledWith("use-persisted-state: Can't read value from storage", expect.any(Error))
    expect(result.current[0]).toBe('initial')
  })
})

describe('concurrent writers on one factory', () => {
  const entryKey = 'persisted_state_hook:concurrent'

  // An in-memory AsyncStorage supplied through the same extension point consumers use. Its
  // promises resolve immediately: no artificial delay is needed, because awaiting at all is
  // enough to let a second writer read before the first one has written.
  function createMemoryStorage() {
    const entries = new Map<string, string>()

    const memoryStorage: AsyncStorage = {
      get: async keys => {
        const key = Array.isArray(keys) ? keys[0] : keys
        const value = entries.get(key)

        return value === undefined ? {} : { [key]: value }
      },
      set: async items => {
        for (const [key, value] of Object.entries(items)) entries.set(key, value)
      },
      remove: async keys => {
        for (const key of Array.isArray(keys) ? keys : [keys]) entries.delete(key)
      },
      onChanged: {
        addListener: () => undefined,
        removeListener: () => undefined,
        hasListener: () => false,
      },
    }

    return { storage: memoryStorage, readEntry: () => entries.get(entryKey) }
  }

  test('should keep both keys when two hooks write at the same time', async () => {
    const memory = createMemoryStorage()
    const [useConcurrentState] = createAsyncPersistedState('concurrent', memory.storage)

    const alpha = renderHook(() => useConcurrentState<string>('alpha', 'initial'))
    const beta = renderHook(() => useConcurrentState<string>('beta', 'initial'))

    await act(async () => {
      // Started together on purpose: the setter reads the entry, awaits, then writes it back
      // whole, so a second writer entering that window carries a snapshot taken before the
      // first one landed.
      await Promise.all([alpha.result.current[1]('one'), beta.result.current[1]('two')])
    })

    // Both keys belong to the same entry and neither writer knows about the other. How the
    // overlap is avoided is open; that no committed write disappears is not.
    expect(JSON.parse(memory.readEntry() ?? '{}')).toEqual({ alpha: 'one', beta: 'two' })
  })
})

describe('storage round-trips', () => {
  test('applies the storage event emitted by its own write', async () => {
    const { asyncStorage } = createFakeAsyncStorage()
    const [useOwnState] = createAsyncPersistedState('own', asyncStorage)
    const { result } = renderHook(() => useOwnState<{ count: number }>('own', { count: 0 }))
    const applied = { count: 1 }

    await act(async () => {
      await result.current[1](applied)
    })

    expect(result.current[0]).toEqual(applied)
    expect(result.current[0]).not.toBe(applied)
  })

  test('rewrites the entry without the key when a setter receives undefined', async () => {
    const entryKey = 'persisted_state_hook:undefinedAsync'
    // Seeded with the target key, so a setter that never persists leaves
    // 'persisted' behind for the fresh reader instead of its initial value.
    const { asyncStorage, stored } = createFakeAsyncStorage({
      [entryKey]: JSON.stringify({ target: 'persisted', sibling: 'kept' }),
    })
    const [useUndefinedState] = createAsyncPersistedState('undefinedAsync', asyncStorage)
    const { result } = renderHook(() => useUndefinedState<string | undefined>('target', 'initial'))

    await act(async () => {})

    await act(async () => {
      await result.current[1](undefined)
    })

    expect(result.current[0]).toBeUndefined()
    expect(JSON.parse(stored[entryKey])).toEqual({ sibling: 'kept' })

    const { result: reader } = renderHook(() => useUndefinedState<string | undefined>('target', 'fresh initial'))

    await act(async () => {})

    expect(reader.current[0]).toBe('fresh initial')
  })
})

describe('write failures', () => {
  const entryKey = 'persisted_state_hook:writeFailuresAsync'

  beforeEach(() => {
    cleanup()
  })

  test.each([
    ['an empty shared entry', '', SyntaxError],
    ['an unreadable entry', '{"alpha":"one"', SyntaxError],
    ['a non-object entry', 'null', TypeError],
  ])('rejects for %s, preserves its bytes, and recovers the queue', async (_name, persistedEntry, ErrorType) => {
    const { asyncStorage, set, stored } = createFakeAsyncStorage({ [entryKey]: persistedEntry })
    const [useWriteFailureState] = createAsyncPersistedState('writeFailuresAsync', asyncStorage)
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const { result } = renderHook(() => useWriteFailureState('gamma', 'initial'))
      let rejection: unknown

      await act(async () => {})
      consoleError.mockClear()

      await act(async () => {
        try {
          await result.current[1]('requested')
        } catch (error) {
          rejection = error
        }
      })

      expect(rejection).toBeInstanceOf(ErrorType)
      expect(result.current[0]).toBe('requested')
      expect(stored[entryKey]).toBe(persistedEntry)
      expect(set).not.toHaveBeenCalled()
      expect(consoleError).not.toHaveBeenCalled()

      stored[entryKey] = '{"alpha":"one"}'

      await act(async () => {
        await result.current[1]('accepted')
      })

      expect(stored[entryKey]).toBe('{"alpha":"one","gamma":"accepted"}')
    } finally {
      consoleError.mockRestore()
    }
  })

  test('rejects on serialization failure, preserves the entry, and recovers the queue', async () => {
    const persistedEntry = '{"alpha":"one"}'
    const { asyncStorage, set, stored } = createFakeAsyncStorage({ [entryKey]: persistedEntry })
    const [useWriteFailureState] = createAsyncPersistedState('writeFailuresAsync', asyncStorage)
    const { result } = renderHook(() => useWriteFailureState<object>('gamma', {}))
    const circular: { self?: unknown } = {}
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    let rejection: unknown

    try {
      circular.self = circular
      await act(async () => {})

      await act(async () => {
        try {
          await result.current[1](circular)
        } catch (error) {
          rejection = error
        }
      })

      expect(rejection).toBeInstanceOf(TypeError)
      expect(result.current[0]).toBe(circular)
      expect(stored[entryKey]).toBe(persistedEntry)
      expect(set).not.toHaveBeenCalled()
      expect(consoleError).not.toHaveBeenCalled()

      await act(async () => {
        await result.current[1]({ accepted: true })
      })

      expect(stored[entryKey]).toBe('{"alpha":"one","gamma":{"accepted":true}}')
    } finally {
      consoleError.mockRestore()
    }
  })

  test('propagates a write-time backend get failure and recovers the queue', async () => {
    const failure = new Error('get failed')
    const { asyncStorage, get, set, stored } = createFakeAsyncStorage()
    const [useWriteFailureState] = createAsyncPersistedState('writeFailuresAsync', asyncStorage)
    const { result } = renderHook(() => useWriteFailureState('gamma', 'initial'))

    await act(async () => {})
    get.mockRejectedValueOnce(failure)

    await act(async () => {
      await expect(result.current[1]('requested')).rejects.toBe(failure)
    })

    expect(result.current[0]).toBe('requested')
    expect(set).not.toHaveBeenCalled()

    await act(async () => {
      await result.current[1]('accepted')
    })

    expect(stored[entryKey]).toBe('{"gamma":"accepted"}')
  })

  test('propagates a backend set failure and recovers the queue', async () => {
    const failure = new Error('set failed')
    const { asyncStorage, set, stored } = createFakeAsyncStorage()
    const [useWriteFailureState] = createAsyncPersistedState('writeFailuresAsync', asyncStorage)
    const { result } = renderHook(() => useWriteFailureState('gamma', 'initial'))

    await act(async () => {})
    set.mockRejectedValueOnce(failure)

    await act(async () => {
      await expect(result.current[1]('requested')).rejects.toBe(failure)
    })

    expect(result.current[0]).toBe('requested')
    expect(stored[entryKey]).toBeUndefined()

    await act(async () => {
      await result.current[1]('accepted')
    })

    expect(stored[entryKey]).toBe('{"gamma":"accepted"}')
  })

  test('propagates a backend remove failure and recovers the queue', async () => {
    const failure = new Error('remove failed')
    const persistedEntry = '{"gamma":"kept"}'
    const { asyncStorage, remove, stored } = createFakeAsyncStorage({ [entryKey]: persistedEntry })
    const [, clearFailedEntry] = createAsyncPersistedState('writeFailuresAsync', asyncStorage)

    remove.mockRejectedValueOnce(failure)

    await act(async () => {
      await expect(clearFailedEntry()).rejects.toBe(failure)
    })

    expect(stored[entryKey]).toBe(persistedEntry)

    await act(async () => {
      await clearFailedEntry()
    })

    expect(stored[entryKey]).toBeUndefined()
  })
})

describe('clearing', () => {
  const entryKey = 'persisted_state_hook:cleared'

  test('is not undone by a write already on its way to storage', async () => {
    const { asyncStorage, stored } = createFakeAsyncStorage()
    const [useDraftState, clearDrafts] = createAsyncPersistedState('cleared', asyncStorage)
    const { result } = renderHook(() => useDraftState<string>('draft', 'initial'))

    await act(async () => {
      // Requested while a write is still in flight, which is what the button doing it competes
      // with in practice. Outside the chain the removal runs first and the write lands after it,
      // putting back what was asked to be gone - and "clear this data" is the one request that
      // must not half happen.
      const write = result.current[1]('typed just before')
      const cleared = clearDrafts()

      await Promise.all([write, cleared])
    })

    expect(stored[entryKey]).toBeUndefined()
  })
})
