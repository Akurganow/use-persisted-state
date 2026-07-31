import isAsyncStorage from '../src/utils/is-async-storage'
import * as browserStorage from '../src/storages/browser-storage'
import * as chromeStorage from '../src/storages/chrome-storage'

const asyncStorage1 = {
  get: new Promise(resolve => {
    resolve('value')
  }),
  set: new Promise<void>(resolve => {
    resolve()
  }),
  remove: new Promise<void>(resolve => {
    resolve()
  }),
}

const asyncStorage2 = {
  get: async () => 'value',
  set: async (value: unknown) => value,
  remove: async (value: unknown) => value,
}

// A storage that hides its asyncness behind a plain function returning a promise. No static check
// can see that, so only the probe call detects it — and any third-party adapter is free to be
// written this way, which is what keeps the probe necessary regardless of what the shipped
// adapters happen to look like. The suite at the bottom of this file covers those separately.
const promiseReturningStorage = {
  get: () => Promise.resolve('value'),
  set: () => Promise.resolve(),
  remove: () => Promise.resolve(),
}

const syncStorage1 = {
  get: () => 'value',
  set: (value: unknown) => value,
  remove: (value: unknown) => value,
}

const syncStorage2 = {
  get: function () {
    return 'value'
  },
  set: function (value: unknown) {
    return value
  },
  remove: function (value: unknown) {
    return value
  },
}

describe('is-async-storage', () => {
  test('should return true if async storage', function () {
    expect(isAsyncStorage(asyncStorage1)).toBe(true)
    expect(isAsyncStorage(asyncStorage2)).toBe(true)
    expect(isAsyncStorage(promiseReturningStorage)).toBe(true)
  })

  test('should return false if not async storage', function () {
    expect(isAsyncStorage(syncStorage1)).toBe(false)
    expect(isAsyncStorage(syncStorage2)).toBe(false)
    expect(isAsyncStorage(null)).toBe(false)
    expect(isAsyncStorage(undefined)).toBe(false)
    expect(isAsyncStorage({ getItem: true })).toBe(false)
  })

  test('should never write to or remove from the inspected storage', function () {
    const set = jest.fn()
    const remove = jest.fn()

    isAsyncStorage({ get: jest.fn(() => 'value'), set, remove })
    isAsyncStorage({ get: jest.fn(() => Promise.resolve('value')), set, remove })

    // Full side-effect freedom is unachievable without a breaking change: the
    // public AsyncStorage interface admits a plain function returning a promise,
    // and a plain function's return type can only be learned by calling it. The
    // achievable contract is that inspection never mutates the storage: get may
    // be probed as a read, while set and remove are never called.
    expect(set).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  test('should not call get when its asyncness is statically known', function () {
    let reads = 0
    const get = async () => {
      reads += 1
      return 'value'
    }

    isAsyncStorage({ get, set: async () => undefined, remove: async () => undefined })

    // The read probe is a last resort: an async function or a promise member
    // proves asyncness by itself, so even the read must not happen.
    expect(reads).toBe(0)
  })

  test('should probe a plain-function get with a single read', function () {
    const get = jest.fn(() => Promise.resolve('value'))

    expect(isAsyncStorage({ get, set: () => Promise.resolve(), remove: () => Promise.resolve() })).toBe(true)
    expect(get).toHaveBeenCalledTimes(1)
  })

  test('should probe a method-style get as a method of its storage', function () {
    const methodStyleStorage = {
      entries: {},
      get() {
        return Promise.resolve(this.entries)
      },
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    }

    // An adapter written as an object of methods is entitled to be called as one.
    // Probing the extracted function leaves `this` undefined, so a `get` reading
    // its own storage throws while merely being inspected.
    expect(isAsyncStorage(methodStyleStorage)).toBe(true)
  })

  test('should report a storage whose probe throws as not async', function () {
    const throwingStorage = {
      get: () => {
        throw new Error('storage unavailable')
      },
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    }

    // Consumers build the factory at module scope, so a throw escaping detection
    // takes the import down. The storage is not provably async, and the sync path
    // raises the same failure at the first read, where a component can handle it.
    expect(isAsyncStorage(throwingStorage)).toBe(false)
  })

  test('should claim the rejection of the storage it probed', async function () {
    const failingStorage = {
      get: () => Promise.reject(new Error('storage unavailable')),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    }

    // A storage whose read fails is still an async storage.
    expect(isAsyncStorage(failingStorage)).toBe(true)

    // Nothing asserts the rejection is claimed, because jest fails this case by itself when it
    // is not. The wait is what makes that failure usable: it holds the rejection inside the
    // test's lifetime, so an unclaimed one surfaces here instead of killing the run outright —
    // which is what it would do to a consuming application on Node 15+.
    await new Promise(resolve => setTimeout(resolve, 0))
  })
})

describe('is-async-storage against the shipped extension adapters', () => {
  const areas = ['local', 'sync', 'managed'] as const

  // jest-webextension-mock aliases `browser` onto the very same object as `chrome`, so one set of
  // spies covers both adapter families. Clearing first keeps the traffic of importing the modules
  // out of the assertions.
  beforeEach(() => {
    for (const area of areas) {
      ;(chrome.storage[area].set as unknown as jest.Mock).mockClear()
      ;(chrome.storage[area].remove as unknown as jest.Mock).mockClear()
    }
  })

  // Both families are held to the same contract and deliberately not folded together: an adapter
  // may declare its asyncness where a static check can see it, or hide it behind a plain function
  // returning a promise, and the predicate reaches the answer by a different route in each case.
  // Which route an adapter takes is its own to change; that it must be recognised either way, and
  // without a write, is not.
  for (const area of areas) {
    test(`recognises the chrome ${area} adapter without writing to it`, () => {
      expect(isAsyncStorage(chromeStorage[area])).toBe(true)

      expect(chrome.storage[area].set).not.toHaveBeenCalled()
      expect(chrome.storage[area].remove).not.toHaveBeenCalled()
    })

    test(`recognises the browser ${area} adapter without writing to it`, () => {
      expect(isAsyncStorage(browserStorage[area])).toBe(true)

      expect(chrome.storage[area].set).not.toHaveBeenCalled()
      expect(chrome.storage[area].remove).not.toHaveBeenCalled()
    })
  }
})
