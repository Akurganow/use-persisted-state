import type React from 'react'
import { useEffect } from 'react'
import type { AsyncStorage, Storage, StorageChange } from '../@types/storage'
import { isFunction } from '@plq/is'

function getValue<T>(key: string, value: string) {
  let newState = null

  try {
    newState = JSON.parse(value)
  } catch (err) {
    console.error("use-persisted-state: Can't parse value from storage", err)
  }

  return newState && key in newState ? (newState[key] as T) : null
}

// Builds the change handler; not a hook, despite living next to one.
function createStorageHandler<T>(
  itemKey: string,
  storageKey: string,
  setState: React.Dispatch<React.SetStateAction<T>>,
  initialValue: T | (() => T),
) {
  return (changes: { [key: string]: StorageChange }): void => {
    Object.entries(changes).forEach(([key, change]) => {
      if (
        key === storageKey &&
        (change.newValue === null || change.newValue === undefined) &&
        change.oldValue !== null &&
        change.oldValue !== undefined
      ) {
        const oldValue = getValue<T>(itemKey, change.oldValue)

        if (oldValue !== initialValue) setState(isFunction(initialValue) ? initialValue() : initialValue)
      }

      if (key === storageKey && change.newValue !== null && change.newValue !== undefined) {
        const newValue = getValue<T>(itemKey, change.newValue)

        if (newValue !== null) setState(newValue)
      }
    })
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
