import type React from 'react'
import { useEffect, useRef } from 'react'
import type { AsyncStorage, Storage, StorageChange } from '../@types/storage'
import { isFunction } from '@plq/is'

/**
 * One key read out of a serialized entry. `null` is a value a caller can store,
 * so it has to stay distinguishable from a key that is not there and from an
 * entry that will not parse — collapsing the three is what dropped a persisted
 * `null` on its way from a change event into state.
 */
type StoredValue<T> = { status: 'stored'; value: T } | { status: 'missing' } | { status: 'unreadable' }

function readStoredValue<T>(key: string, entry: string): StoredValue<T> {
  let parsed: unknown

  try {
    parsed = JSON.parse(entry)
  } catch (err) {
    console.error("use-persisted-state: Can't parse value from storage", err)

    return { status: 'unreadable' }
  }

  if (!parsed || !(key in (parsed as object))) return { status: 'missing' }

  return { status: 'stored', value: (parsed as Record<string, unknown>)[key] as T }
}

// Restores the initial value when the whole entry is removed from the storage.
function applyRemoval<T>(
  change: StorageChange,
  itemKey: string,
  applyValue: (value: T) => void,
  mountInitialValue: React.RefObject<T | (() => T)>,
): void {
  if (change.oldValue === null || change.oldValue === undefined) return

  const oldValue = readStoredValue<T>(itemKey, change.oldValue)
  const declaredInitialValue = mountInitialValue.current
  // Compared against the resolved value: a factory is never equal to what it
  // produces, so comparing the declaration re-applies the initial value on every
  // removal.
  const initialValue = isFunction(declaredInitialValue) ? declaredInitialValue() : declaredInitialValue

  // An entry that would not parse cannot be shown to have held the initial value,
  // so the fallback is applied rather than skipped. The entry is gone either way,
  // and stale state left in place is worse than a redundant restore.
  if (oldValue.status === 'stored' && oldValue.value === initialValue) return

  applyValue(initialValue)
}

/**
 * Reports whether this change is the write the hook itself just made, forgetting
 * the record when it is. A backend reports a write to every listener, the one
 * that made it included, and applying that echo is the storage-to-state re-sync
 * this hook was rebuilt without, arriving by another road: it decodes the entry
 * again and hands the caller an equal value with a new identity, plus a render
 * for a value it already holds.
 *
 * The price, accepted knowingly: for a value JSON cannot carry, the writer keeps
 * what it set - NaN - while every other component on the key decodes the null
 * that reached storage, so the two disagree until one of them remounts. Applying
 * the echo would settle that disagreement and bring back both the second
 * storage-to-state path and the render per write, so it is not the repair it
 * looks like.
 *
 * Forgetting on the first match keeps a later identical entry a change. Another
 * hook writing the same bytes is suppressed along with it, and nothing is lost:
 * it would have replaced a value with an equal one.
 */
function consumeOwnWriteEcho(change: StorageChange, pendingOwnWrite: React.RefObject<string | null>): boolean {
  if (pendingOwnWrite.current === null || change.newValue !== pendingOwnWrite.current) return false

  pendingOwnWrite.current = null

  return true
}

// Builds the change handler. Not a hook, despite living next to one.
function createStorageHandler<T>(
  itemKey: string,
  storageKey: string,
  applyValue: (value: T) => void,
  mountInitialValue: React.RefObject<T | (() => T)>,
  pendingOwnWrite: React.RefObject<string | null>,
) {
  return (changes: { [key: string]: StorageChange }): void => {
    for (const [key, change] of Object.entries(changes)) {
      if (key !== storageKey) continue

      if (consumeOwnWriteEcho(change, pendingOwnWrite)) continue

      if (change.newValue === null || change.newValue === undefined) {
        applyRemoval<T>(change, itemKey, applyValue, mountInitialValue)
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
  pendingOwnWrite: React.RefObject<string | null>,
): void {
  // As in `useState`, the value restored when the entry is removed is the one
  // given on the first render, matching what the hook itself falls back to.
  // Freezing it also keeps an inline object or factory, whose identity changes
  // every render, from tearing the subscription down and rebuilding it.
  const mountInitialValue = useRef(initialValue)

  useEffect(() => {
    const handleStorage = createStorageHandler<T>(key, storageKey, applyValue, mountInitialValue, pendingOwnWrite)

    storage.onChanged.addListener(handleStorage)

    return () => {
      if (storage.onChanged.hasListener(handleStorage)) {
        storage.onChanged.removeListener(handleStorage)
      }
    }
  }, [key, storage.onChanged, storageKey, applyValue, pendingOwnWrite])
}
