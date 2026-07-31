import { createListenerRegistry, toStorageChanges, toStoredItems } from '../../src/utils/extension-storage'

describe('extension-storage', function () {
  describe('listener registry', function () {
    test('dispatches to listeners of the area that changed', function () {
      const registry = createListenerRegistry()
      const listener = jest.fn()

      registry.createOnChanged('local').addListener(listener)
      registry.fire({ key: { oldValue: null, newValue: 'value' } }, 'local')

      expect(listener).toHaveBeenCalledTimes(1)
    })

    test('does not leak a change between areas', function () {
      const registry = createListenerRegistry()
      const listener = jest.fn()

      registry.createOnChanged('local').addListener(listener)
      registry.fire({ key: { oldValue: null, newValue: 'value' } }, 'sync')

      expect(listener).not.toHaveBeenCalled()
    })

    // Both browsers also report `session` changes, an area this library does not
    // track. Dispatching one used to read an undefined listener set and throw.
    test('ignores changes from an area it does not track', function () {
      const registry = createListenerRegistry()
      const listener = jest.fn()

      registry.createOnChanged('local').addListener(listener)

      expect(() => {
        registry.fire({ key: { oldValue: null, newValue: 'value' } }, 'session' as never)
      }).not.toThrow()
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('value narrowing', function () {
    test('keeps strings and drops everything else', function () {
      expect(toStoredItems({ a: 'kept', b: 42, c: { nested: true }, d: null })).toEqual({ a: 'kept' })
    })

    test('reports non-string change values as absent', function () {
      expect(toStorageChanges({ key: { oldValue: 42, newValue: 'text' } })).toEqual({
        key: { oldValue: null, newValue: 'text' },
      })
    })

    test('preserves undefined, which means the key was absent', function () {
      expect(toStorageChanges({ key: { newValue: 'text' } })).toEqual({
        key: { oldValue: undefined, newValue: 'text' },
      })
    })
  })
})
