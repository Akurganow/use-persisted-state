import createWebStorage from '../../src/utils/create-web-storage'

// Its own file: the shared subscription is released only when the route table
// reaches zero, and a fresh module registry per file is what makes that path
// reachable without depending on which case ran first.
//
// The runtime modelled here is the one the packaging smoke check runs on — it
// defines addEventListener and nothing to undo it with, which is how the
// asymmetry this guards against was found.
describe('web storage on a runtime with half the DOM event API', () => {
  const removeEventListener = globalThis.removeEventListener

  beforeEach(() => {
    Object.defineProperty(globalThis, 'removeEventListener', { value: undefined, configurable: true })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'removeEventListener', { value: removeEventListener, configurable: true })
  })

  test('should not take a subscription it cannot release', function () {
    const addEventListener = jest.spyOn(globalThis, 'addEventListener')
    const storage = createWebStorage(localStorage)
    const listener = jest.fn()

    storage.onChanged.addListener(listener)

    const subscriptions = addEventListener.mock.calls.filter(([type]) => type === 'storage').length

    addEventListener.mockRestore()

    expect(subscriptions).toBe(0)

    // Nothing was taken, so releasing the last listener has nothing to undo —
    // reaching for the missing half of the API here is what used to throw.
    expect(() => {
      storage.onChanged.removeListener(listener)
    }).not.toThrow()
    expect(storage.onChanged.hasListener(listener)).toBe(false)
  })
})
