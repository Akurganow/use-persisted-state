import type React from 'react'
import { useEffect, useRef } from 'react'
import type { AsyncStorage, Storage, StorageChange } from '../@types/storage'
import { isFunction, isObject } from '@plq/is'

// A stored `null` is a value, so absence needs a status of its own rather than a `null` value.
type StoredValue<T> = { status: 'stored'; value: T } | { status: 'unavailable' }

function readStoredValue<T>(key: string, entry: string): StoredValue<T> {
  let parsed: unknown

  try {
    parsed = JSON.parse(entry)
  } catch (err) {
    console.error("use-persisted-state: Can't parse value from storage", err)

    return { status: 'unavailable' }
  }

  // `in` throws on a primitive, and a throw here cuts off every listener queued behind this one.
  if (!isObject(parsed) || !(key in parsed)) return { status: 'unavailable' }

  return { status: 'stored', value: parsed[key] as T }
}

function applyRemoval<T>(
  change: StorageChange,
  itemKey: string,
  applyValue: (value: T) => void,
  latestInitialValue: React.RefObject<T | (() => T)>,
): void {
  if (change.oldValue === null || change.oldValue === undefined) return

  const oldValue = readStoredValue<T>(itemKey, change.oldValue)
  const declaredInitialValue = latestInitialValue.current
  // Resolved before comparing: a factory is never equal to what it produces.
  const initialValue = isFunction(declaredInitialValue) ? declaredInitialValue() : declaredInitialValue

  // Restore redundantly rather than leave stale state when the entry's old value cannot be read.
  if (oldValue.status === 'stored' && oldValue.value === initialValue) return

  applyValue(initialValue)
}

// A list, not one slot: a write may still be awaiting its echo when the next one starts.
// Capped, because a backend that never reports back leaves every record unmatched.
const MAX_PENDING_OWN_WRITES = 8

/** Records an entry before it is written, because a backend may report the change before the write settles. */
export function recordOwnWrite(pendingOwnWrites: React.RefObject<string[]>, item: string): void {
  const pending = pendingOwnWrites.current

  if (pending.length >= MAX_PENDING_OWN_WRITES) pending.shift()

  pending.push(item)
}

// Applying a hook's own echo would re-decode the entry and re-render for a value it already holds.
function consumeOwnWriteEcho(entry: string, pendingOwnWrites: React.RefObject<string[]>): boolean {
  const matched = pendingOwnWrites.current.indexOf(entry)

  if (matched === -1) return false

  // A backend reports writes in the order it took them, so a record still unmatched has no echo left.
  pendingOwnWrites.current.splice(0, matched + 1)

  return true
}

function createStorageHandler<T>(
  itemKey: string,
  storageKey: string,
  applyValue: (value: T) => void,
  latestInitialValue: React.RefObject<T | (() => T)>,
  pendingOwnWrites: React.RefObject<string[]>,
) {
  return (changes: { [key: string]: StorageChange }): void => {
    for (const [key, change] of Object.entries(changes)) {
      if (key !== storageKey) continue

      // Ahead of the echo check, which needs an entry to match and a removal has none.
      if (change.newValue === null || change.newValue === undefined) {
        applyRemoval<T>(change, itemKey, applyValue, latestInitialValue)
        continue
      }

      if (consumeOwnWriteEcho(change.newValue, pendingOwnWrites)) continue

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
  pendingOwnWrites: React.RefObject<string[]>,
): void {
  // A ref, not a dependency: an inline initial value changes identity every render and would churn it.
  const latestInitialValue = useRef(initialValue)

  latestInitialValue.current = initialValue

  useEffect(() => {
    const handleStorage = createStorageHandler<T>(key, storageKey, applyValue, latestInitialValue, pendingOwnWrites)

    storage.onChanged.addListener(handleStorage)

    return () => {
      if (storage.onChanged.hasListener(handleStorage)) {
        storage.onChanged.removeListener(handleStorage)
      }
    }
  }, [key, storage.onChanged, storageKey, applyValue, pendingOwnWrites])
}
