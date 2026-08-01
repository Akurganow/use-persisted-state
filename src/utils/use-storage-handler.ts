import type React from 'react'
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { AsyncStorage, Storage, StorageChange } from '../@types/storage'
import { isFunction } from '@plq/is'
import parsePersistedEntry, { hasOwnPersistedKey, type PersistedEntry } from './parse-persisted-entry'

const useIsomorphicLayoutEffect = typeof globalThis.window === 'undefined' ? useEffect : useLayoutEffect

// A stored `null` is a value, so absence needs a status of its own rather than a `null` value.
type StoredValue<T> = { status: 'stored'; value: T } | { status: 'unavailable' }

function readStoredValue<T>(key: string, entry: string): StoredValue<T> {
  let parsed: PersistedEntry

  try {
    parsed = parsePersistedEntry(entry)
  } catch (err) {
    console.error("use-persisted-state: Can't parse value from storage", err)

    return { status: 'unavailable' }
  }

  if (!hasOwnPersistedKey(parsed, key)) return { status: 'unavailable' }

  return { status: 'stored', value: parsed[key] as T }
}

function applyInitialValue<T>(
  applyValue: (value: T) => void,
  latestInitialValue: React.RefObject<T | (() => T)>,
): void {
  const declaredInitialValue = latestInitialValue.current
  const initialValue = isFunction(declaredInitialValue) ? declaredInitialValue() : declaredInitialValue

  applyValue(initialValue)
}

function createStorageHandler<T>(
  itemKey: string,
  storageKey: string,
  applyValue: (value: T) => void,
  latestInitialValue: React.RefObject<T | (() => T)>,
) {
  return (changes: { [key: string]: StorageChange }): void => {
    for (const [key, change] of Object.entries(changes)) {
      if (key !== storageKey) continue

      if (change.newValue === null || change.newValue === undefined) {
        applyInitialValue(applyValue, latestInitialValue)
        continue
      }

      const newValue = readStoredValue<T>(itemKey, change.newValue)

      if (newValue.status === 'stored') applyValue(newValue.value)
    }
  }
}

export default function useStorageHandler<T>(
  key: string,
  storageKey: string,
  applyValue: (value: T) => void,
  storage: AsyncStorage | Storage,
  initialValue: T | (() => T),
): void {
  const latestInitialValue = useRef(initialValue)

  // An abandoned render must not change the fallback observed by the active listener.
  useIsomorphicLayoutEffect(() => {
    latestInitialValue.current = initialValue
  }, [initialValue])

  useEffect(() => {
    const handleStorage = createStorageHandler<T>(key, storageKey, applyValue, latestInitialValue)

    storage.onChanged.addListener(handleStorage)

    return () => {
      if (storage.onChanged.hasListener(handleStorage)) {
        storage.onChanged.removeListener(handleStorage)
      }
    }
  }, [key, storage.onChanged, storageKey, applyValue])
}
