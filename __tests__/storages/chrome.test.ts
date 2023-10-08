/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as chromeStorage from '../../src/storages/chrome-storage'

describe('chrome-storage', function () {
  const types: ('local' | 'sync' | 'managed')[] = ['local', 'sync', 'managed']
  types.forEach(type => {
    describe(type, function () {
      const storage = chromeStorage[type]
      const storageMethods: ('get' | 'set' | 'remove')[] =
        ['get', 'set', 'remove']
      const storageMethodsTestParams = {
        get: 'key',
        set: { key: 'value' },
        remove: 'key',
      }

      const onChangedMethods: ('addListener' | 'removeListener' | 'hasListener')[] =
        ['addListener', 'removeListener', 'hasListener']

      storageMethods.forEach(method => {
        const storageMethod = storage[method]

        test(`${method} should be defined`, function () {
          expect(storageMethod).toBeDefined()
        })

        test(`${type}.${method}`, function () {
          // @ts-ignore
          storageMethod(storageMethodsTestParams[method])

          expect(chrome.storage[type][method])
            .toHaveBeenCalledTimes(1)
          expect(chrome.storage[type][method])
            .toHaveBeenCalledWith(storageMethodsTestParams[method], expect.any(Function))
        })
      })

      onChangedMethods.forEach(method => {
        test(`onChanged.${method} should be defined`, function () {
          expect(storage.onChanged[method]).toBeDefined()
        })
      })

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
  })
})
