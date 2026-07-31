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
