import createWebStorage from '../../src/utils/create-web-storage'

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
    storage.set({ key1: 'foo' })

    expect(storage.get('key1')).toEqual({ key1: 'foo' })

    storage.set({ key2: 'bar', key3: 'baz' })

    expect(storage.get(['key2', 'key3'])).toEqual({
      key2: 'bar',
      key3: 'baz',
    })

    storage.remove('key1')

    expect(storage.get('key1')).toEqual({})

    storage.remove(['key2', 'key3'])

    expect(storage.get(['key2', 'key3'])).toEqual({})
  })

  // Without a storage global the adapter is inert, but it still has to satisfy
  // the Storage contract: a caller subscribing on the server must not crash.
  describe('without a storage global', function () {
    const inertStorage = createWebStorage(undefined)

    test('should add and remove listener', function () {
      const listener = jest.fn()

      inertStorage.onChanged.addListener(listener)

      expect(inertStorage.onChanged.hasListener(listener)).toBe(true)

      inertStorage.onChanged.removeListener(listener)

      expect(inertStorage.onChanged.hasListener(listener)).toBe(false)
    })

    test('should discard writes and read back nothing', function () {
      inertStorage.set({ key1: 'foo' })

      expect(inertStorage.get('key1')).toEqual({})

      inertStorage.remove('key1')
    })
  })

  // A missing global is the only inert case. Anything else broken has to fail on
  // first use, as it did before, rather than quietly drop the caller's data.
  test('should fail loudly when handed a broken storage', function () {
    const brokenStorage = createWebStorage(null as unknown as globalThis.Storage)

    expect(() => brokenStorage.get('key1')).toThrow()
  })
})
