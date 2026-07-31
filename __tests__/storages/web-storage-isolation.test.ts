import localStorageAdapter from '../../src/storages/local-storage'
import sessionStorageAdapter from '../../src/storages/session-storage'

// jsdom's StorageEvent constructor rejects the storage of jest-localstorage-mock
// ('member storageArea is not of type Storage'), so the area is attached to the
// finished event instead. Omitting it produces the unlabelled event a consumer
// gets when synthesizing one by hand.
function dispatchStorageEvent(key: string, area?: globalThis.Storage): void {
  const event = new StorageEvent('storage', { key, newValue: 'value', oldValue: null })

  if (area) Object.defineProperty(event, 'storageArea', { value: area })

  globalThis.dispatchEvent(event)
}

describe('web storage adapter isolation', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  test('a write through the sessionStorage adapter does not notify localStorage listeners', () => {
    const listener = jest.fn()

    localStorageAdapter.onChanged.addListener(listener)
    sessionStorageAdapter.set({ isolation_probe: 'value' })

    expect(listener).not.toHaveBeenCalled()

    // Paired with the negative assertion above, which on its own would also
    // hold if the localStorage adapter notified nobody at all.
    localStorageAdapter.set({ isolation_probe: 'value' })

    expect(listener).toHaveBeenCalledTimes(1)

    localStorageAdapter.onChanged.removeListener(listener)
  })

  describe('native storage events', () => {
    test('an event addressed to one area reaches only that adapter', () => {
      const localListener = jest.fn()
      const sessionListener = jest.fn()

      localStorageAdapter.onChanged.addListener(localListener)
      sessionStorageAdapter.onChanged.addListener(sessionListener)

      dispatchStorageEvent('cross_tab_probe', localStorage)

      localStorageAdapter.onChanged.removeListener(localListener)
      sessionStorageAdapter.onChanged.removeListener(sessionListener)

      expect(localListener).toHaveBeenCalledTimes(1)
      expect(sessionListener).not.toHaveBeenCalled()
    })

    // Consumers synthesize this event to test cross-tab sync under jsdom, and to
    // notify the writing tab in production. Dropping it would break them silently.
    test('an event that names no area still reaches the adapter', () => {
      const listener = jest.fn()

      localStorageAdapter.onChanged.addListener(listener)

      dispatchStorageEvent('cross_tab_probe')

      localStorageAdapter.onChanged.removeListener(listener)

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })
})
