import type React from 'react'
import { useEffect } from 'react'
import type { AsyncStorage, Storage, StorageChange } from '../@types/storage'
import { isFunction } from '@plq/is'

function getValue<T>(key: string, value: string): T | null {
  let parsed: unknown = null

  try {
    parsed = JSON.parse(value)
  } catch (err) {
    console.error("use-persisted-state: Can't parse value from storage", err)
  }

  return parsed && key in (parsed as object) ? ((parsed as Record<string, unknown>)[key] as T) : null
}

// Restores the initial value when the whole entry is removed from the storage.
function applyRemoval<T>(
  change: StorageChange,
  itemKey: string,
  setState: React.Dispatch<React.SetStateAction<T>>,
  initialValue: T | (() => T),
): void {
  if (change.oldValue === null || change.oldValue === undefined) return

  const oldValue = getValue<T>(itemKey, change.oldValue)

  if (oldValue !== initialValue) setState(isFunction(initialValue) ? initialValue() : initialValue)
}

// Builds the change handler. Not a hook, despite living next to one.
function createStorageHandler<T>(
  itemKey: string,
  storageKey: string,
  setState: React.Dispatch<React.SetStateAction<T>>,
  initialValue: T | (() => T),
) {
  return (changes: { [key: string]: StorageChange }): void => {
    for (const [key, change] of Object.entries(changes)) {
      if (key !== storageKey) continue

      if (change.newValue === null || change.newValue === undefined) {
        applyRemoval<T>(change, itemKey, setState, initialValue)
        continue
      }

      const newValue = getValue<T>(itemKey, change.newValue)

      if (newValue !== null) setState(newValue)
    }
  }
}

export default function useStorageHandler<T>(
  key: string,
  storageKey: string,
  setState: React.Dispatch<React.SetStateAction<T>>,
  storage: AsyncStorage | Storage,
  initialValue: T | (() => T),
): void {
  useEffect(() => {
    const handleStorage = createStorageHandler<T>(key, storageKey, setState, initialValue)

    storage.onChanged.addListener(handleStorage)

    return () => {
      if (storage.onChanged.hasListener(handleStorage)) {
        storage.onChanged.removeListener(handleStorage)
      }
    }
  }, [initialValue, key, storage.onChanged, storageKey, setState])
}
