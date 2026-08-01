import { createPersistedState } from '../src'
import storage from '../src/storages/local-storage'
import createStorage from '../src/utils/create-web-storage'
import { renderHook, cleanup, act } from '@testing-library/react'
import type { Storage as StorageAdapter } from '../src/@types/storage'

describe('hook defined correctly', () => {
  const [usePersistedState, clear] = createPersistedState('test', storage)

  beforeEach(() => {
    cleanup()
    clear()
    localStorage.clear()
  })

  test('is callable', () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))

    expect(usePersistedState).toBeDefined()
    expect(clear).toBeDefined()
    expect(result.current).toBeDefined()
    expect(localStorage.setItem).not.toHaveBeenCalled()

    act(() => {
      result.current[1]('baz')
    })

    // Keeps the negative assertion above honest: a dead write path would satisfy
    // it exactly as well as rendering-writes-nothing does.
    expect(localStorage.setItem).toHaveBeenCalledTimes(1)
  })

  test('localstorage called correctly', () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))
    const expected = JSON.stringify({ foo: 'baz' })

    act(() => {
      result.current[1]('baz')
    })

    expect(localStorage.setItem).toHaveBeenLastCalledWith('persisted_state_hook:test', expected)
    expect(localStorage.__STORE__['persisted_state_hook:test']).toEqual(expected)
  })
})

describe('hook works on SSR', () => {
  const testingSSRStorage = createStorage(undefined as unknown as Storage)
  const [usePersistedState, clear] = createPersistedState('test', testingSSRStorage)

  test('is callable', () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))

    expect(usePersistedState).toBeDefined()
    expect(clear).toBeDefined()
    expect(result.current).toBeDefined()
  })

  test('localstorage called correctly', () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))

    act(() => {
      result.current[1]('baz')
    })

    expect(result.current[0]).toBe('baz')
  })
})

describe('reference initial values', () => {
  const [usePersistedState] = createPersistedState('loop', storage)

  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  test('does not re-render endlessly when initialValue is an inline object and a value is already persisted', () => {
    localStorage.setItem('persisted_state_hook:loop', JSON.stringify({ inlineObject: { count: 1 } }))

    // With the defect present the sync effect loop would exhaust React's update
    // depth or hang jest, so the run is capped by an explicit render budget.
    const renderBudget = 60
    let renders = 0

    const { result } = renderHook(() => {
      renders += 1

      if (renders > renderBudget) {
        throw new Error(`exceeded render budget of ${renderBudget}: infinite render loop`)
      }

      return usePersistedState('inlineObject', { count: 0 })
    })

    expect(result.current[0]).toEqual({ count: 1 })
  })
})

describe('functional updates', () => {
  const [usePersistedState] = createPersistedState('updates', storage)

  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  test('applies every functional update queued in one batch', () => {
    const { result } = renderHook(() => usePersistedState('count', 0))

    act(() => {
      result.current[1](previous => previous + 1)
      result.current[1](previous => previous + 1)
    })

    expect(result.current[0]).toBe(2)
  })
})

describe('changing key', () => {
  const [usePersistedState] = createPersistedState('keys', storage)

  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  test('follows the key it is given and writes under it', () => {
    localStorage.setItem('persisted_state_hook:keys', JSON.stringify({ alpha: 'ALPHA', beta: 'BETA' }))

    const { result, rerender } = renderHook(({ itemKey }) => usePersistedState(itemKey, ''), {
      initialProps: { itemKey: 'alpha' },
    })

    expect(result.current[0]).toBe('ALPHA')

    rerender({ itemKey: 'beta' })

    expect(result.current[0]).toBe('BETA')

    act(() => {
      result.current[1](previous => `${previous}-edited`)
    })

    // A hook still showing the previous key's value writes that value back under
    // the new key, destroying whatever the new key held.
    expect(result.current[0]).toBe('BETA-edited')
    expect(JSON.parse(localStorage.__STORE__['persisted_state_hook:keys'])).toEqual({
      alpha: 'ALPHA',
      beta: 'BETA-edited',
    })
  })
})

describe('clearing', () => {
  const [usePersistedState, clear] = createPersistedState('drafts', storage)

  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  test('restores the initialValue the hook has now, not the one it mounted with', () => {
    const { result, rerender } = renderHook(({ initialValue }) => usePersistedState('draft', initialValue), {
      initialProps: { initialValue: 'first' },
    })

    act(() => {
      result.current[1]('edited')
    })

    rerender({ initialValue: 'second' })

    act(() => {
      clear()
    })

    // A caller whose default travels with its data — `usePersistedState('draft',
    // props.defaultDraft)` — gets the default of the record it is showing. The
    // key-change path already reads the live initialValue, so a removal reading
    // the mount-time one makes one hook answer "what is my initial value?" two
    // different ways depending on which path asked.
    expect(result.current[0]).toBe('second')
  })
})

describe('storage round-trips', () => {
  const entryKey = 'persisted_state_hook:echo'
  const [usePersistedState] = createPersistedState('echo', storage)

  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  test('applies the storage event emitted by its own write', () => {
    const { result } = renderHook(() => usePersistedState<{ count: number }>('own', { count: 0 }))
    const applied = { count: 1 }

    act(() => {
      result.current[1](applied)
    })

    expect(result.current[0]).toEqual(applied)
    expect(result.current[0]).not.toBe(applied)
  })

  test('still applies a write made by another hook on the same key', () => {
    const { result: writer } = renderHook(() => usePersistedState('shared', 'initial'))
    const { result: reader } = renderHook(() => usePersistedState('shared', 'initial'))

    act(() => {
      writer.current[1]('from the writer')
    })

    expect(reader.current[0]).toBe('from the writer')
  })

  test('applies a later event even when its entry matches an earlier write', () => {
    const { result } = renderHook(() => usePersistedState('sticky', 'initial'))

    act(() => {
      result.current[1]('first')
    })

    const earlierEntry = localStorage.__STORE__[entryKey]

    act(() => {
      storage.set({ [entryKey]: JSON.stringify({ sticky: 'second' }) })
    })

    expect(result.current[0]).toBe('second')

    act(() => {
      storage.set({ [entryKey]: earlierEntry })
    })

    expect(result.current[0]).toBe('first')
  })
})

describe('foreign entries under the factory key', () => {
  const entryKey = 'persisted_state_hook:foreign'
  const [usePersistedState] = createPersistedState('foreign', storage)

  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  test('reports an empty stored entry and falls back to the initial value', () => {
    localStorage.setItem(entryKey, '')
    const getItem = localStorage.getItem as jest.Mock
    const defaultGetItem = getItem.getMockImplementation()

    // jest-localstorage-mock treats an empty string as absent, unlike Web Storage.
    getItem.mockImplementation(key => (key in localStorage.__STORE__ ? localStorage.__STORE__[key] : null))
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const { result } = renderHook(() => usePersistedState('foo', 'initial'))

      expect(result.current[0]).toBe('initial')
      expect(consoleError).toHaveBeenCalledWith(
        "use-persisted-state: Can't parse value from storage",
        expect.any(SyntaxError),
      )
    } finally {
      consoleError.mockRestore()
      getItem.mockImplementation(defaultGetItem)
    }
  })

  test('does not read an inherited constructor as a persisted value', () => {
    localStorage.setItem(entryKey, '{}')

    const { result } = renderHook(() => usePersistedState('constructor', 'initial'))

    expect(result.current[0]).toBe('initial')
  })

  test('reports a non-object JSON entry and mounts on its initial value', () => {
    localStorage.setItem(entryKey, '5')
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const { result } = renderHook(() => usePersistedState('foo', 'initial'))

      expect(result.current[0]).toBe('initial')
      expect(consoleError).toHaveBeenCalledWith(
        "use-persisted-state: Can't parse value from storage",
        expect.any(TypeError),
      )
    } finally {
      consoleError.mockRestore()
    }
  })
})

describe('setter identity', () => {
  const [usePersistedState] = createPersistedState('identity', storage)

  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  test('survives a re-render but follows a changed key', () => {
    const { result, rerender } = renderHook(({ itemKey }) => usePersistedState(itemKey, 'value'), {
      initialProps: { itemKey: 'foo' },
    })
    const setterAfterMount = result.current[1]

    rerender({ itemKey: 'foo' })

    expect(result.current[1]).toBe(setterAfterMount)

    // Holding the setter across a key change would keep writing under the old
    // key, so stability must not be bought with an empty dependency list.
    rerender({ itemKey: 'bar' })

    expect(result.current[1]).not.toBe(setterAfterMount)
  })

  test('survives a write made through it', () => {
    const { result } = renderHook(() => usePersistedState('written', 'initial'))
    const setterBeforeWrite = result.current[1]

    act(() => {
      result.current[1]('written value')
    })

    // The write has to have happened, or the identity below holds for the wrong
    // reason.
    expect(result.current[0]).toBe('written value')

    // This is what the ref behind the setter is for. Resolving updates against
    // the state instead would put it in the dependencies, and every write would
    // hand consumers a new setter - the memoised children they pass it to would
    // re-render on each one.
    expect(result.current[1]).toBe(setterBeforeWrite)
  })
})

describe('storage access', () => {
  test('does not read the storage again on re-renders', () => {
    const get = jest.fn((): { [key: string]: string } => ({}))
    const spyStorage: StorageAdapter = {
      get,
      set: jest.fn(),
      remove: jest.fn(),
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(() => false),
      },
    }
    const [useSpiedPersistedState] = createPersistedState('reads', spyStorage)
    const { rerender } = renderHook(() => useSpiedPersistedState('foo', 'bar'))

    expect(get).toHaveBeenCalledTimes(1)

    rerender()
    rerender()
    rerender()

    expect(get).toHaveBeenCalledTimes(1)
  })
})

describe('concurrent writers on one factory', () => {
  test('keeps both keys when two hooks write in the same tick', () => {
    const entryKey = 'persisted_state_hook:syncConcurrent'
    const entries = new Map<string, string>()

    const memoryStorage: StorageAdapter = {
      get: keys => {
        const key = Array.isArray(keys) ? keys[0] : keys
        const value = entries.get(key)

        return value === undefined ? {} : { [key]: value }
      },
      set: items => {
        for (const [key, value] of Object.entries(items)) entries.set(key, value)
      },
      remove: keys => {
        for (const key of Array.isArray(keys) ? keys : [keys]) entries.delete(key)
      },
      onChanged: {
        addListener: () => undefined,
        removeListener: () => undefined,
        hasListener: () => false,
      },
    }

    const [useConcurrentState] = createPersistedState('syncConcurrent', memoryStorage)
    const alpha = renderHook(() => useConcurrentState<string>('alpha', 'initial'))
    const beta = renderHook(() => useConcurrentState<string>('beta', 'initial'))

    act(() => {
      alpha.result.current[1]('one')
      beta.result.current[1]('two')
    })

    // The asynchronous factory loses one of these: its setter awaits between reading the entry
    // and writing it back, so a second writer starts from a snapshot taken before the first one
    // landed. Here the read, the merge and the write run with nothing in between. Keeping that
    // difference as a case rather than as a measurement is what stops it being rediscovered.
    expect(JSON.parse(entries.get(entryKey) ?? '{}')).toEqual({ alpha: 'one', beta: 'two' })
  })
})

describe('an entry the hook cannot read', () => {
  const entryKey = 'persisted_state_hook:damaged'
  const [usePersistedState] = createPersistedState('damaged', storage)
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    cleanup()
    localStorage.clear()
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('is left in storage rather than replaced by the next write', () => {
    // Truncated rather than garbage on purpose: alpha and beta are still legible in the bytes,
    // and only a write that replaces them makes the loss permanent.
    const damagedEntry = '{"alpha":"one","beta":"two"'

    localStorage.setItem(entryKey, damagedEntry)

    const { result } = renderHook(() => usePersistedState('gamma', 'initial'))

    act(() => {
      result.current[1]('three')
    })

    // The write is refused, not the update: the caller keeps what it set, and hears why it did
    // not persist.
    expect(result.current[0]).toBe('three')
    expect(localStorage.__STORE__[entryKey]).toBe(damagedEntry)
    expect(consoleError).toHaveBeenCalledWith("use-persisted-state: Can't write value to storage", expect.any(Error))
  })

  test('survives a write when it is a foreign JSON value', () => {
    // A bare `null` did not merely lose the write, it threw out of the setter and into whatever
    // called it, which for a consumer is a click handler. Catching that throw here is the whole
    // point of the case: a crashing setter leaves the entry untouched for the same reason a
    // refusal does, so the storage assertion below holds either way and proves nothing on its
    // own. What separates the two is whether the caller was handed an exception.
    localStorage.setItem(entryKey, 'null')

    const { result } = renderHook(() => usePersistedState('gamma', 'initial'))
    let thrownBySetter: unknown = null

    act(() => {
      try {
        result.current[1]('three')
      } catch (err) {
        thrownBySetter = err
      }
    })

    expect(thrownBySetter).toBeNull()
    expect(result.current[0]).toBe('three')
    expect(localStorage.__STORE__[entryKey]).toBe('null')
  })
})
