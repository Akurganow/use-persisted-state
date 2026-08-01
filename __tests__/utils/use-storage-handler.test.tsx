import { renderHook, act } from '@testing-library/react'
import useStorageHandler from '../../src/utils/use-storage-handler'
import type { Storage, StorageChange, StorageChangeListener } from '../../src/@types/storage'

const storageKey = 'persisted_state_hook:test'
const itemKey = 'foo'

function createSpyStorage() {
  const listeners = new Set<StorageChangeListener>()
  const addListener = jest.fn((listener: StorageChangeListener) => {
    listeners.add(listener)
  })
  const removeListener = jest.fn((listener: StorageChangeListener) => {
    listeners.delete(listener)
  })
  const storage: Storage = {
    get: jest.fn(() => ({})),
    set: jest.fn(),
    remove: jest.fn(),
    onChanged: {
      addListener,
      removeListener,
      hasListener: listener => listeners.has(listener),
    },
  }
  const fire = (changes: { [key: string]: StorageChange }): void => {
    for (const listener of [...listeners]) {
      listener(changes)
    }
  }

  return { storage, addListener, removeListener, fire }
}

describe('use-storage-handler', () => {
  test('keeps one subscription when initialValue is a new object on every render', () => {
    const { storage, addListener, removeListener } = createSpyStorage()
    const applyValue = jest.fn()

    const { rerender } = renderHook(
      ({ initialValue }) =>
        useStorageHandler<{ count: number }>(itemKey, storageKey, applyValue, storage, initialValue),
      { initialProps: { initialValue: { count: 0 } } },
    )

    rerender({ initialValue: { count: 0 } })
    rerender({ initialValue: { count: 0 } })

    expect(addListener).toHaveBeenCalledTimes(1)
    expect(removeListener).not.toHaveBeenCalled()
  })

  test('restores the initialValue of the latest render when the entry is removed', () => {
    const { storage, fire } = createSpyStorage()
    const applyValue = jest.fn()

    const { rerender } = renderHook(
      ({ initialValue }) => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, initialValue),
      { initialProps: { initialValue: 'first' } },
    )

    rerender({ initialValue: 'second' })

    act(() => {
      fire({ [storageKey]: { oldValue: JSON.stringify({ [itemKey]: 'stored' }), newValue: null } })
    })

    // The key-change path reads the initialValue of the render it happens on, so
    // a removal has to read the same one, or one hook answers "what is the
    // initial value?" two different ways depending on which path asked.
    expect(applyValue).toHaveBeenCalledWith('second')
  })

  describe('removal events', () => {
    test.each([
      ['an omitted old value', undefined],
      ['an equal old value', JSON.stringify({ [itemKey]: 'initial' })],
      ['unreadable old bytes', 'not json'],
    ])('restores the initial value for %s', (_name, oldValue) => {
      const { storage, fire } = createSpyStorage()
      const applyValue = jest.fn()
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      const parse = jest.spyOn(JSON, 'parse')

      try {
        renderHook(() => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, () => 'initial'))

        act(() => {
          fire({ [storageKey]: { oldValue, newValue: null } })
        })

        expect(applyValue).toHaveBeenCalledWith('initial')
        expect(parse).not.toHaveBeenCalled()
        expect(consoleError).not.toHaveBeenCalled()
      } finally {
        parse.mockRestore()
        consoleError.mockRestore()
      }
    })
  })

  test('applies a stored null instead of reading it as no value', () => {
    const { storage, fire } = createSpyStorage()
    const applyValue = jest.fn()

    renderHook(() => useStorageHandler<string | null>(itemKey, storageKey, applyValue, storage, 'initial'))

    act(() => {
      fire({ [storageKey]: { oldValue: null, newValue: JSON.stringify({ [itemKey]: null }) } })
    })

    expect(applyValue).toHaveBeenCalledWith(null)
  })

  // Neither case yields a value for the key, and the hook holds its state in
  // both. What separates them is the diagnostic: a parse failure is a defect the
  // consumer should hear about, an entry carrying only other keys is routine.
  describe('entries that yield no value for the key', () => {
    let consoleError: jest.SpyInstance

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleError.mockRestore()
    })

    test('reports an entry that will not parse', () => {
      const { storage, fire } = createSpyStorage()
      const applyValue = jest.fn()

      renderHook(() => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, 'initial'))

      act(() => {
        fire({ [storageKey]: { oldValue: null, newValue: 'not json' } })
      })

      expect(consoleError).toHaveBeenCalled()
      expect(applyValue).not.toHaveBeenCalled()
    })

    test('reports a non-object JSON entry', () => {
      const { storage, fire } = createSpyStorage()
      const applyValue = jest.fn()

      renderHook(() => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, 'initial'))

      act(() => {
        fire({ [storageKey]: { oldValue: null, newValue: '5' } })
      })

      expect(consoleError).toHaveBeenCalledWith(
        "use-persisted-state: Can't parse value from storage",
        expect.any(TypeError),
      )
      expect(applyValue).not.toHaveBeenCalled()
    })

    test('says nothing about an entry that simply does not carry the key', () => {
      const { storage, fire } = createSpyStorage()
      const applyValue = jest.fn()

      renderHook(() => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, 'initial'))

      act(() => {
        fire({ [storageKey]: { oldValue: null, newValue: JSON.stringify({ other: 'value' }) } })
      })

      expect(consoleError).not.toHaveBeenCalled()
      expect(applyValue).not.toHaveBeenCalled()
    })
  })

  test('treats only an own constructor property as stored', () => {
    const { storage, fire } = createSpyStorage()
    const applyValue = jest.fn()

    renderHook(() => useStorageHandler('constructor', storageKey, applyValue, storage, 'initial'))

    act(() => {
      fire({ [storageKey]: { oldValue: null, newValue: '{}' } })
    })
    expect(applyValue).not.toHaveBeenCalled()

    act(() => {
      fire({ [storageKey]: { oldValue: '{}', newValue: JSON.stringify({ constructor: 'stored' }) } })
    })
    expect(applyValue).toHaveBeenCalledWith('stored')
  })

  test('follows the key the hook is rendering for after it changes', () => {
    const { storage, fire } = createSpyStorage()
    const applyValue = jest.fn()

    const { rerender } = renderHook(
      ({ renderedKey }) => useStorageHandler<string>(renderedKey, storageKey, applyValue, storage, 'initial'),
      { initialProps: { renderedKey: 'first' } },
    )

    rerender({ renderedKey: 'second' })

    act(() => {
      fire({ [storageKey]: { oldValue: null, newValue: JSON.stringify({ first: 'FIRST', second: 'SECOND' }) } })
    })

    // A listener left subscribed for the key the hook mounted with reads the wrong property out
    // of every entry that arrives afterwards, and hands the caller another key's value.
    expect(applyValue).toHaveBeenCalledWith('SECOND')
    expect(applyValue).not.toHaveBeenCalledWith('FIRST')
  })

  test('ignores a change reported for another factory entry', () => {
    const { storage, fire } = createSpyStorage()
    const applyValue = jest.fn()

    renderHook(() => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, 'initial'))

    // Factories share a backend, and its listeners hear about every key in it. An entry of
    // another factory can hold this hook's item key and mean something entirely different.
    act(() => {
      fire({
        'persisted_state_hook:elsewhere': { oldValue: null, newValue: JSON.stringify({ [itemKey]: 'not ours' }) },
      })
    })

    expect(applyValue).not.toHaveBeenCalled()
  })

  test('removes its listener on unmount', () => {
    const { storage, removeListener } = createSpyStorage()
    const applyValue = jest.fn()

    const { unmount } = renderHook(() => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, 'initial'))

    unmount()

    expect(removeListener).toHaveBeenCalledTimes(1)
  })
})
