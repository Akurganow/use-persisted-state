import { createAsyncPersistedState } from '../src'
import { local as storage } from '../src/storages/browser-storage'
import { waitFor } from '@testing-library/react'
import { renderHook, cleanup, act } from '@testing-library/react'

const [usePersistedState, clear] = createAsyncPersistedState('test', storage)

describe('hook defined correctly', () => {
  beforeEach(() => {
    cleanup()
    clear()
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
