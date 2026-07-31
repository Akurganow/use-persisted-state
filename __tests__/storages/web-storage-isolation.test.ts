import localStorageAdapter from '../../src/storages/local-storage'
import sessionStorageAdapter from '../../src/storages/session-storage'

describe('web storage adapter isolation', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  test('a write through the sessionStorage adapter does not notify localStorage listeners', () => {
    const listener = jest.fn()

    localStorageAdapter.onChanged.addListener(listener)
    sessionStorageAdapter.set({ isolation_probe: 'value' })
    localStorageAdapter.onChanged.removeListener(listener)

    expect(listener).not.toHaveBeenCalled()
  })
})
