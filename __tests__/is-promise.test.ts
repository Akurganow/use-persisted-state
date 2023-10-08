import isPromise from '../src/utils/is-promise'

describe('is-promise', () => {
  test('should return true if promise', function () {
    const fn1 = new Promise<void>(resolve => { resolve() })
    const fn2 = async function () { return undefined }

    expect(isPromise(fn1)).toBe(true)
    expect(isPromise(fn2())).toBe(true)
  })

  test('should return false if not promise', function () {
    expect(isPromise(null)).toBe(false)
    expect(isPromise(function () { return undefined })).toBe(false)
    expect(isPromise(undefined)).toBe(false)
    expect(isPromise(10)).toBe(false)
    expect(isPromise('string')).toBe(false)
    expect(isPromise({ a: 'a' })).toBe(false)
    expect(isPromise(['a', 'b'])).toBe(false)
  })
})
