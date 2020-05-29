import createPersistedState from '../src'
import { renderHook, cleanup, act } from '@testing-library/react-hooks'

const [usePersistedState, clear] = createPersistedState('test')

describe('hook defined correctly', () => {
  afterEach(() => {
    cleanup()
    clear()
    localStorage.clear()
  });

  it('is callable', () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))

    expect(usePersistedState).toBeDefined()
    expect(clear).toBeDefined()
    expect(result.current).toBeDefined()
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('localstorage called correctly', () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))
    const expected = JSON.stringify({ foo: 'baz' })

    act(() => {
      result.current[1]('baz')
    })

    expect(localStorage.setItem).toHaveBeenLastCalledWith('persisted_state_hook:test', expected)
    expect(localStorage.__STORE__['persisted_state_hook:test']).toEqual(expected)
  })
})
