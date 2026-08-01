import parsePersistedEntry from '../../src/utils/parse-persisted-entry'

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
})
