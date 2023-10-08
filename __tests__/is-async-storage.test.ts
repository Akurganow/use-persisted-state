import isAsyncStorage from '../src/utils/is-async-storage'

const asyncStorage1 = {
  get: new Promise(resolve => { resolve('value') }),
}

const asyncStorage2 = {
  get: async () => 'value',
}

const syncStorage1 = {
  get: () => 'value',
}

const syncStorage2 = {
  get: function () { return 'value' },
}

describe('is-async-storage', () => {
  test('should return true if async storage', function () {
    expect(isAsyncStorage(asyncStorage1)).toBe(true)
    expect(isAsyncStorage(asyncStorage2)).toBe(true)
  })

  test('should return false if not async storage', function () {
    expect(isAsyncStorage(syncStorage1)).toBe(false)
    expect(isAsyncStorage(syncStorage2)).toBe(false)
    expect(isAsyncStorage(null)).toBe(false)
    expect(isAsyncStorage(undefined)).toBe(false)
    expect(isAsyncStorage({ getItem: true })).toBe(false)
  })
})
