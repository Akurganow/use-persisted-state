import { createAsyncPersistedState } from '../src'
import { local as storage } from '../src/storages/browser-storage'
import { waitFor } from '@testing-library/react'
import { renderHook, cleanup, act } from '@testing-library/react-hooks'

const [usePersistedState, clear] = createAsyncPersistedState('test', storage)

describe('hook defined correctly', () => {
  beforeEach(() => {
    cleanup()
    clear()
    localStorage.clear()
  })

  it('is callable', () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))

    expect(usePersistedState).toBeDefined()
    expect(clear).toBeDefined()
    expect(result.current).toBeDefined()
    expect(browser.storage.local.set).not.toHaveBeenCalled()
  })

  it('localstorage called correctly', async () => {
    const { result } = renderHook(() => usePersistedState('foo', 'bar'))
    const expected = JSON.stringify({ foo: 'baz' })

    act(() => {
      result.current[1]('baz')
    })

    await waitFor(() =>
      expect(browser.storage.local.set).toHaveBeenLastCalledWith({ 'persisted_state_hook:test': expected })
    )
  })
})
