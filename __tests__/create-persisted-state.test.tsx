import { createPersistedState } from '../src'
import storage from '../src/storages/local-storage'
import createStorage from '../src/utils/create-web-storage'
import { renderHook, cleanup, act } from '@testing-library/react'

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
