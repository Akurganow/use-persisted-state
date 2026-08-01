import { createPersistedState } from '../src'
import storage from '../src/storages/local-storage'
import createStorage from '../src/utils/create-web-storage'
import { renderHook, cleanup, act } from '@testing-library/react'
import type { Storage as StorageAdapter } from '../src/@types/storage'

/** A silent backend: unlike the async fake, it never fires a change event for its own writes. */
function createFakeSyncStorage(entries: { [key: string]: string } = {}) {
  const stored: { [key: string]: string } = { ...entries }
  const get = jest.fn((keys: string | string[]) => {
    const result: { [key: string]: string } = {}

    for (const key of Array.isArray(keys) ? keys : [keys]) {
      if (key in stored) result[key] = stored[key]
    }

    return result
  })
  const set = jest.fn((items: { [key: string]: string }) => {
    Object.assign(stored, items)
  })
  const remove = jest.fn((keys: string | string[]) => {
    for (const key of Array.isArray(keys) ? keys : [keys]) delete stored[key]
  })
  const fakeStorage: StorageAdapter = {
    get,
    set,
    remove,
    onChanged: {
      addListener: () => undefined,
      removeListener: () => undefined,
      hasListener: () => false,
    },
  }

  return { fakeStorage, get, set, remove, stored }
}

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

  test('persists every functional update queued in one batch', () => {
    const { result } = renderHook(() => usePersistedState('count', 0))

    act(() => {
      result.current[1](previous => previous + 1)
      result.current[1](previous => previous + 1)
    })

    expect(result.current[0]).toBe(2)
    expect(JSON.parse(localStorage.__STORE__['persisted_state_hook:updates'])).toEqual({ count: 2 })
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

  // `constructor` is an inherited data property; `__proto__` is an accessor on
  // `Object.prototype`, so it breaks under assignment where `constructor` does not.
  test('round-trips a __proto__ key without touching the prototype', () => {
    localStorage.setItem(entryKey, '{"alpha":"kept"}')

    const { result } = renderHook(() => usePersistedState('__proto__', 'initial'))

    expect(result.current[0]).toBe('initial')

    act(() => {
      result.current[1]('written')
    })

    expect(localStorage.__STORE__[entryKey]).toBe('{"alpha":"kept","__proto__":"written"}')

    const { result: reader } = renderHook(() => usePersistedState('__proto__', 'fresh initial'))

    expect(reader.current[0]).toBe('written')
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

describe('write failures', () => {
  const entryKey = 'persisted_state_hook:writeFailures'

  beforeEach(() => {
    cleanup()
  })

  test.each([
    ['an empty shared entry', '', SyntaxError],
    ['an unreadable entry', '{"alpha":"one"', SyntaxError],
    ['a non-object entry', 'null', TypeError],
  ])('throws for %s without replacing its bytes', (_name, persistedEntry, ErrorType) => {
    const { fakeStorage, set, stored } = createFakeSyncStorage({ [entryKey]: persistedEntry })
    const [useWriteFailureState] = createPersistedState('writeFailures', fakeStorage)
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const { result } = renderHook(() => useWriteFailureState('gamma', 'initial'))
      let thrownBySetter: unknown

      consoleError.mockClear()

      act(() => {
        try {
          result.current[1]('requested')
        } catch (error) {
          thrownBySetter = error
        }
      })

      expect(thrownBySetter).toBeInstanceOf(ErrorType)
      expect(result.current[0]).toBe('requested')
      expect(stored[entryKey]).toBe(persistedEntry)
      expect(set).not.toHaveBeenCalled()
      expect(consoleError).not.toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })

  test('throws on serialization failure without replacing the entry', () => {
    const persistedEntry = '{"alpha":"one"}'
    const { fakeStorage, set, stored } = createFakeSyncStorage({ [entryKey]: persistedEntry })
    const [useWriteFailureState] = createPersistedState('writeFailures', fakeStorage)
    const { result } = renderHook(() => useWriteFailureState<object>('gamma', {}))
    const circular: { self?: unknown } = {}
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    let thrownBySetter: unknown

    try {
      circular.self = circular

      act(() => {
        try {
          result.current[1](circular)
        } catch (error) {
          thrownBySetter = error
        }
      })

      expect(thrownBySetter).toBeInstanceOf(TypeError)
      expect(result.current[0]).toBe(circular)
      expect(stored[entryKey]).toBe(persistedEntry)
      expect(set).not.toHaveBeenCalled()
      expect(consoleError).not.toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })

  test('propagates a write-time backend get failure unchanged', () => {
    const failure = new Error('get failed')
    const { fakeStorage, get, set } = createFakeSyncStorage()
    const [useWriteFailureState] = createPersistedState('writeFailures', fakeStorage)
    const { result } = renderHook(() => useWriteFailureState('gamma', 'initial'))
    let thrownBySetter: unknown

    get.mockImplementationOnce(() => {
      throw failure
    })

    act(() => {
      try {
        result.current[1]('requested')
      } catch (error) {
        thrownBySetter = error
      }
    })

    expect(thrownBySetter).toBe(failure)
    expect(result.current[0]).toBe('requested')
    expect(set).not.toHaveBeenCalled()
  })

  test('propagates a backend set failure unchanged', () => {
    const failure = new Error('set failed')
    const { fakeStorage, set } = createFakeSyncStorage()
    const [useWriteFailureState] = createPersistedState('writeFailures', fakeStorage)
    const { result } = renderHook(() => useWriteFailureState('gamma', 'initial'))
    let thrownBySetter: unknown

    set.mockImplementationOnce(() => {
      throw failure
    })

    act(() => {
      try {
        result.current[1]('requested')
      } catch (error) {
        thrownBySetter = error
      }
    })

    expect(thrownBySetter).toBe(failure)
    expect(result.current[0]).toBe('requested')
  })

  test('propagates a backend remove failure unchanged', () => {
    const failure = new Error('remove failed')
    const { fakeStorage, remove } = createFakeSyncStorage()
    const [, clearFailedEntry] = createPersistedState('writeFailures', fakeStorage)
    let thrownByClear: unknown

    remove.mockImplementationOnce(() => {
      throw failure
    })

    try {
      clearFailedEntry()
    } catch (error) {
      thrownByClear = error
    }

    expect(thrownByClear).toBe(failure)
  })
})
