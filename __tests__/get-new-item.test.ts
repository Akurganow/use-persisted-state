/* eslint-disable @typescript-eslint/ban-ts-comment */
import getNewItem from '../src/utils/get-new-item'

describe('get-new-item', function () {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    // @ts-ignore
    console.error.mockRestore()
  })

  afterEach(() => {
    // @ts-ignore
    console.error.mockClear()
  })

  it('should return stringified object', function () {
    expect(getNewItem<string>('key', '{"foo": "bar"}', 'baz')).toEqual(
      JSON.stringify({
        foo: 'bar',
        key: 'baz',
      }),
    )
  })

  it('should report and refuse an entry it cannot parse', function () {
    // This used to answer with `{"key":"baz"}` and report it. The caller writes what comes back
    // over the whole entry, so that answer replaced every other hook's key with nothing and took
    // the bytes a repair still needed with it.
    expect(() => getNewItem<string>('key', 'foo: bar', 'baz')).toThrow(SyntaxError)

    expect(console.error).toHaveBeenCalled()
  })

  it('should report and refuse an entry that is not an object of keys', function () {
    // Any JSON can end up under a factory's key, and merging into a value that is not an object
    // of keys never produced one: a number or a string came back out of `JSON.stringify` as
    // itself, an array stayed an array, and `null` threw out of `Object.assign` into the caller.
    // All four lost the value being set, three of them silently.
    for (const foreignEntry of ['5', '"text"', '[1,2]', 'null']) {
      expect(() => getNewItem<string>('key', foreignEntry, 'baz')).toThrow(TypeError)
    }

    expect(console.error).toHaveBeenCalledTimes(4)
  })

  it('should not discard the other keys of an entry it cannot parse', function () {
    // A factory keeps all of its hooks in one storage entry, so what this function returns for a
    // damaged entry is written over every key in it, not just the one being set. Truncated rather
    // than garbage on purpose: the other keys are still legible in the bytes, and only a write
    // that replaces them makes the loss permanent.
    const damagedEntry = '{"alpha":"one","beta":"two"'
    let written: string | undefined

    try {
      written = getNewItem<string>('gamma', damagedEntry, 'three')
    } catch {
      // Refusing outright is an acceptable answer to a damaged entry — the bytes stay where a
      // repair can still reach them, and nothing is written over them.
      written = undefined
    }

    // Anything that does come back is going to be written over the whole entry, so it has to
    // carry the keys that were in it. Naming the one payload this used to return would let an
    // empty object or an empty string through, and those lose the writing hook's key as well.
    if (written !== undefined) {
      expect(JSON.parse(written)).toMatchObject({ alpha: 'one', beta: 'two' })
    }
  })
})
