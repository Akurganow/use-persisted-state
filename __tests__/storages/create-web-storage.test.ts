import createWebStorage  from '../../src/utils/create-web-storage'

describe('create-web-storage', function () {
  const storage = createWebStorage(localStorage)

  test('should create valid storage', function () {
    expect(storage.get).toBeDefined()
    expect(storage.set).toBeDefined()
    expect(storage.remove).toBeDefined()
    expect(storage.onChanged.addListener).toBeDefined()
    expect(storage.onChanged.removeListener).toBeDefined()
    expect(storage.onChanged.hasListener).toBeDefined()
  })

  test('should add and remove listener', function () {
    const listener = jest.fn()

    storage.onChanged.addListener(listener)

    expect(storage.onChanged.hasListener(listener)).toBe(true)

    storage.onChanged.removeListener(listener)

    expect(storage.onChanged.hasListener(listener)).toBe(false)
  })

  test('should work correctly', function () {
    storage.set({key1: 'foo'})

    expect(storage.get('key1')).toEqual({key1: 'foo'})

    storage.set({key2: 'bar', key3: 'baz'})

    expect(storage.get(['key2', 'key3'])).toEqual({
      key2: 'bar',
      key3: 'baz',
    })

    storage.remove('key1')

    expect(storage.get('key1')).toEqual({})

    storage.remove(['key2', 'key3'])

    expect(storage.get(['key2', 'key3'])).toEqual({})
  })
})
