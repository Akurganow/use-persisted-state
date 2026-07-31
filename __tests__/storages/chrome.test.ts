/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as chromeStorage from '../../src/storages/chrome-storage'
import isAsyncStorage from '../../src/utils/is-async-storage'

describe('chrome-storage', function () {
  // Every hook creation inspects its storage. Answering "is this async?" by
  // calling get would put a round trip to the extension process on that path.
  test('should be recognised as async without being called', function () {
    // @ts-ignore
    chrome.storage.local.get.mockClear()

    expect(isAsyncStorage(chromeStorage.local)).toBe(true)
    expect(chrome.storage.local.get).not.toHaveBeenCalled()
  })

  const types: ('local' | 'sync' | 'managed')[] = ['local', 'sync', 'managed']
  for (const type of types) {
    describe(type, function () {
      const storage = chromeStorage[type]
      const storageMethods: ('get' | 'set' | 'remove')[] = ['get', 'set', 'remove']
      const storageMethodsTestParams = {
        get: 'key',
        set: { key: 'value' },
        remove: 'key',
      }

      const onChangedMethods: ('addListener' | 'removeListener' | 'hasListener')[] = [
        'addListener',
        'removeListener',
        'hasListener',
      ]

      for (const method of storageMethods) {
        const storageMethod = storage[method]

        test(`${method} should be defined`, function () {
          expect(storageMethod).toBeDefined()
        })

        test(`${type}.${method}`, function () {
          // @ts-ignore
          storageMethod(storageMethodsTestParams[method])

          expect(chrome.storage[type][method]).toHaveBeenCalledTimes(1)
          expect(chrome.storage[type][method]).toHaveBeenCalledWith(
            storageMethodsTestParams[method],
            expect.any(Function),
          )
        })
      }

      for (const method of onChangedMethods) {
        test(`onChanged.${method} should be defined`, function () {
          expect(storage.onChanged[method]).toBeDefined()
        })
      }

      afterEach(() => {
        chrome.storage[type].clear()

        // @ts-ignore
        chrome.storage[type].get.mockClear()
        // @ts-ignore
        chrome.storage[type].set.mockClear()
        // @ts-ignore
        chrome.storage[type].remove.mockClear()
        // @ts-ignore
        chrome.storage[type].clear.mockClear()
      })
    })
  }
})
