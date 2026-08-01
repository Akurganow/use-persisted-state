import type React from 'react'
import { renderHook, act } from '@testing-library/react'
import useStorageHandler from '../../src/utils/use-storage-handler'
import type { Storage, StorageChange, StorageChangeListener } from '../../src/@types/storage'

const storageKey = 'persisted_state_hook:test'
const itemKey = 'foo'

// Stable across renders, as the ref the hooks pass in is.
const createOwnWriteRecord = (): React.RefObject<string[]> => ({ current: [] })

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
    const pendingOwnWrites = createOwnWriteRecord()

    const { rerender } = renderHook(
      ({ initialValue }) =>
        useStorageHandler<{ count: number }>(itemKey, storageKey, applyValue, storage, initialValue, pendingOwnWrites),
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
    const pendingOwnWrites = createOwnWriteRecord()

    const { rerender } = renderHook(
      ({ initialValue }) =>
        useStorageHandler<string>(itemKey, storageKey, applyValue, storage, initialValue, pendingOwnWrites),
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

  test('does not restore a function initialValue the removed entry already held', () => {
    const { storage, fire } = createSpyStorage()
    const applyValue = jest.fn()
    const pendingOwnWrites = createOwnWriteRecord()

    renderHook(() =>
      useStorageHandler<string>(itemKey, storageKey, applyValue, storage, () => 'initial', pendingOwnWrites),
    )

    act(() => {
      fire({ [storageKey]: { oldValue: JSON.stringify({ [itemKey]: 'initial' }), newValue: null } })
    })

    // A factory is never equal to the value it produces, so comparing against the
    // declaration instead of the resolved value re-applies it every time.
    expect(applyValue).not.toHaveBeenCalled()
  })

  test('applies a stored null instead of reading it as no value', () => {
    const { storage, fire } = createSpyStorage()
    const applyValue = jest.fn()
    const pendingOwnWrites = createOwnWriteRecord()

    renderHook(() =>
      useStorageHandler<string | null>(itemKey, storageKey, applyValue, storage, 'initial', pendingOwnWrites),
    )

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
      const pendingOwnWrites = createOwnWriteRecord()

      renderHook(() => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, 'initial', pendingOwnWrites))

      act(() => {
        fire({ [storageKey]: { oldValue: null, newValue: 'not json' } })
      })

      expect(consoleError).toHaveBeenCalled()
      expect(applyValue).not.toHaveBeenCalled()
    })

    test('says nothing about an entry that is a bare JSON primitive', () => {
      const { storage, fire } = createSpyStorage()
      const applyValue = jest.fn()
      const pendingOwnWrites = createOwnWriteRecord()

      renderHook(() => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, 'initial', pendingOwnWrites))

      // A number parses, so this is not a broken entry: it is a foreign one, as
      // routine as an entry carrying only other keys. `in` throws on it, and the
      // throw runs inside the adapter's notify loop, so it would take out every
      // listener queued behind this one as well.
      act(() => {
        fire({ [storageKey]: { oldValue: null, newValue: '5' } })
      })

      expect(consoleError).not.toHaveBeenCalled()
      expect(applyValue).not.toHaveBeenCalled()
    })

    test('says nothing about an entry that simply does not carry the key', () => {
      const { storage, fire } = createSpyStorage()
      const applyValue = jest.fn()
      const pendingOwnWrites = createOwnWriteRecord()

      renderHook(() => useStorageHandler<string>(itemKey, storageKey, applyValue, storage, 'initial', pendingOwnWrites))

      act(() => {
        fire({ [storageKey]: { oldValue: null, newValue: JSON.stringify({ other: 'value' }) } })
      })

      expect(consoleError).not.toHaveBeenCalled()
      expect(applyValue).not.toHaveBeenCalled()
    })
  })

  test('removes its listener on unmount', () => {
    const { storage, removeListener } = createSpyStorage()
    const applyValue = jest.fn()
    const pendingOwnWrites = createOwnWriteRecord()

    const { unmount } = renderHook(() =>
      useStorageHandler<string>(itemKey, storageKey, applyValue, storage, 'initial', pendingOwnWrites),
    )

    unmount()

    expect(removeListener).toHaveBeenCalledTimes(1)
  })
})
