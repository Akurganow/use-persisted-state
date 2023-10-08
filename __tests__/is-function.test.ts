import isFunction from '../src/utils/is-function'

describe('is-function', () => {
  test('should return true if function', () => {
    const fn1 = function () { return undefined }
    const fn2 = () => { undefined }
    const fn3 = () => undefined

    expect(isFunction(fn1)).toBe(true)
    expect(isFunction(fn2)).toBe(true)
    expect(isFunction(fn3)).toBe(true)
  })

  test('should return false if promise', function () {
    const fn = new Promise(() => undefined )

    expect(isFunction(fn)).toBe(false)
  })

  it('should return false if not function', function () {
    expect(isFunction(null)).toBe(false)
    expect(isFunction(undefined)).toBe(false)
    expect(isFunction(10)).toBe(false)
    expect(isFunction('string')).toBe(false)
    expect(isFunction({ a: 'a' })).toBe(false)
    expect(isFunction(['a', 'b'])).toBe(false)
  })
})
