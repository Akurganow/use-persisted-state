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

describe('own writes', () => {
  const entryKey = 'persisted_state_hook:echo'
  const [usePersistedState] = createPersistedState('echo', storage)

  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  test('keeps the value it was given rather than the storage round-trip of it', () => {
    const { result } = renderHook(() => usePersistedState<{ count: number }>('own', { count: 0 }))
    const applied = { count: 1 }

    act(() => {
      result.current[1](applied)
    })

    // The adapter reports the write back, and decoding it yields an equal object
    // with a new identity, so the caller is handed something it did not set and
    // re-renders for it.
    expect(result.current[0]).toBe(applied)
  })

  test('still applies a write made by another hook on the same key', () => {
    const { result: writer } = renderHook(() => usePersistedState('shared', 'initial'))
    const { result: reader } = renderHook(() => usePersistedState('shared', 'initial'))

    act(() => {
      writer.current[1]('from the writer')
    })

    expect(reader.current[0]).toBe('from the writer')
  })

  test('consumes the suppression on the echo it was recorded for', () => {
    const { result } = renderHook(() => usePersistedState('sticky', 'initial'))

    act(() => {
      result.current[1]('first')
    })

    const ownEntry = localStorage.__STORE__[entryKey]

    act(() => {
      storage.set({ [entryKey]: JSON.stringify({ sticky: 'second' }) })
    })

    expect(result.current[0]).toBe('second')

    // The same bytes arriving again are a genuine external write, not the echo
    // the suppression was recorded for.
    act(() => {
      storage.set({ [entryKey]: ownEntry })
    })

    expect(result.current[0]).toBe('first')
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

    const readsAfterMount = get.mock.calls.length

    rerender()
    rerender()
    rerender()

    expect(get.mock.calls.length).toBe(readsAfterMount)
  })
})
