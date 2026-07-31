import createWebStorage from '../../src/utils/create-web-storage'

function createMemoryArea(entries: { [key: string]: string }): globalThis.Storage {
  const store = new Map(Object.entries(entries))

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    key(index) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key) {
      store.delete(key)
    },
    setItem(key, value) {
      store.set(key, value)
    },
  }
}

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

  // Driven through a spec-faithful area rather than the global: the published
  // build of jest-localstorage-mock reads `getItem` as `this[key] || null`, so
  // its own store cannot hold an empty string and would hide the case entirely.
  test('should read back a stored empty string', function () {
    const emptyStringStorage = createWebStorage(createMemoryArea({ emptyKey: '' }))

    // A real area answers `null` only for an absent key, so `''` is a value the
    // caller stored. Reading it as absence drops it from the result and reports
    // a removal that never happened.
    expect(emptyStringStorage.get('emptyKey')).toEqual({ emptyKey: '' })
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
