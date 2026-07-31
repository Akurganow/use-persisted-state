import createWebStorage from '../../src/utils/create-web-storage'

// Its own file on purpose: the route table behind the shared subscription is
// module state, and jest gives each test file a fresh module registry. Sharing
// a file with other cases would make the counts depend on execution order.
describe('web storage DOM subscription', () => {
  test('adapters share one subscription and release it with the last listener', () => {
    const addEventListener = jest.spyOn(globalThis, 'addEventListener')
    const removeEventListener = jest.spyOn(globalThis, 'removeEventListener')

    const adapters = Array.from({ length: 5 }, () => createWebStorage(localStorage))
    const listeners = adapters.map(() => jest.fn())

    adapters.forEach((adapter, index) => {
      adapter.onChanged.addListener(listeners[index])
    })

    const subscriptions = addEventListener.mock.calls.filter(([type]) => type === 'storage').length

    adapters.forEach((adapter, index) => {
      adapter.onChanged.removeListener(listeners[index])
    })

    const releases = removeEventListener.mock.calls.filter(([type]) => type === 'storage').length

    addEventListener.mockRestore()
    removeEventListener.mockRestore()

    expect(subscriptions).toBe(1)
    expect(releases).toBe(1)
  })

  test('a factory call nobody listens to attaches nothing', () => {
    const addEventListener = jest.spyOn(globalThis, 'addEventListener')

    createWebStorage(localStorage)

    const subscriptions = addEventListener.mock.calls.filter(([type]) => type === 'storage').length

    addEventListener.mockRestore()

    expect(subscriptions).toBe(0)
  })
})
