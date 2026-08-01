import parsePersistedEntry, { hasOwnPersistedKey } from '../../src/utils/parse-persisted-entry'

describe('parse-persisted-entry', () => {
  test('returns an empty entry when storage has no value', () => {
    expect(parsePersistedEntry(undefined)).toEqual({})
  })

  test('preserves object values including null', () => {
    expect(parsePersistedEntry('{"foo":"bar","nullable":null}')).toEqual({ foo: 'bar', nullable: null })
  })

  test('rejects an empty entry', () => {
    expect(() => parsePersistedEntry('')).toThrow(SyntaxError)
  })

  test('rejects malformed JSON', () => {
    expect(() => parsePersistedEntry('{"foo":')).toThrow(SyntaxError)
  })

  test.each(['null', '5', '"text"', '[1,2]'])('rejects non-object JSON %s', entry => {
    expect(() => parsePersistedEntry(entry)).toThrow(TypeError)
  })

  // A write propagates this one into consumer code, where a bare TypeError names
  // nothing a reader could trace back to this library.
  test('names the library in the error a write propagates', () => {
    expect(() => parsePersistedEntry('5')).toThrow(/^use-persisted-state:/)
  })

  // A hook key of `__proto__` survives only while the entry is built by JSON.parse,
  // spread or a computed key. Copying it by assignment hits the accessor on
  // `Object.prototype` and the key vanishes. `constructor`, an inherited data
  // property, cannot catch that: assigning over it just creates an own property.
  test('keeps a __proto__ key as an own property', () => {
    const entry = parsePersistedEntry('{"__proto__":"stored"}')

    expect(hasOwnPersistedKey(entry, '__proto__')).toBe(true)
    expect(Object.getOwnPropertyDescriptor(entry, '__proto__')?.value).toBe('stored')
    expect(Object.getPrototypeOf(entry)).toBe(Object.prototype)
  })

  test('reports an absent __proto__ key rather than the prototype', () => {
    expect(hasOwnPersistedKey(parsePersistedEntry('{}'), '__proto__')).toBe(false)
  })
})
