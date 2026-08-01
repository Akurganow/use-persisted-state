import type React from 'react'
import { useEffect, useRef } from 'react'
import type { AsyncStorage, Storage, StorageChange } from '../@types/storage'
import { isFunction, isObject } from '@plq/is'

/**
 * One key read out of a serialized entry. `null` is a value a caller can store,
 * so a stored `null` has to stay distinguishable from no value at all —
 * collapsing the two is what dropped a persisted `null` on its way from a change
 * event into state.
 *
 * A key that is not in the entry and an entry that will not parse are both
 * `unavailable`. They differ in why, not in what a caller does next, and the
 * difference that matters is reported where it happens: only a parse failure is
 * a defect worth a diagnostic, an entry holding other keys is routine.
 */
type StoredValue<T> = { status: 'stored'; value: T } | { status: 'unavailable' }

function readStoredValue<T>(key: string, entry: string): StoredValue<T> {
  let parsed: unknown

  try {
    parsed = JSON.parse(entry)
  } catch (err) {
    console.error("use-persisted-state: Can't parse value from storage", err)

    return { status: 'unavailable' }
  }

  // A foreign entry can be any JSON value, and `in` throws on a primitive. This
  // runs inside the adapter's notify loop, where a throw also cuts off every
  // listener queued behind this one.
  if (!isObject(parsed) || !(key in parsed)) return { status: 'unavailable' }

  return { status: 'stored', value: parsed[key] as T }
}

// Restores the initial value when the whole entry is removed from the storage.
function applyRemoval<T>(
  change: StorageChange,
  itemKey: string,
  applyValue: (value: T) => void,
  latestInitialValue: React.RefObject<T | (() => T)>,
): void {
  if (change.oldValue === null || change.oldValue === undefined) return

  const oldValue = readStoredValue<T>(itemKey, change.oldValue)
  const declaredInitialValue = latestInitialValue.current
  // Compared against the resolved value: a factory is never equal to what it
  // produces, so comparing the declaration re-applies the initial value on every
  // removal.
  const initialValue = isFunction(declaredInitialValue) ? declaredInitialValue() : declaredInitialValue

  // An entry with no readable value for the key cannot be shown to have held the
  // initial value, so the fallback is applied rather than skipped. The entry is
  // gone either way, and stale state left in place is worse than a redundant
  // restore.
  if (oldValue.status === 'stored' && oldValue.value === initialValue) return

  applyValue(initialValue)
}

// A backend that reports nothing back leaves every record unmatched, so the list
// needs a ceiling or it grows by one string per write for as long as the hook is
// mounted. A bound, not a tuning: a backend that does report drains the list on
// every echo, and one that reports late is what the list exists for.
const MAX_PENDING_OWN_WRITES = 8

/**
 * Remembers an entry the hook is about to write, so the change the backend
 * reports for it can be told apart from someone else's write.
 *
 * Recorded before the write, because a backend may report it before the call
 * settles. One slot was not enough: a backend free to report after its write
 * settles - chrome and browser storage both are - lets the next write overwrite
 * the record of a write still waiting to be reported, and that unsuppressed echo
 * then puts the earlier value back over the later one.
 */
export function recordOwnWrite(pendingOwnWrites: React.RefObject<string[]>, item: string): void {
  const pending = pendingOwnWrites.current

  if (pending.length >= MAX_PENDING_OWN_WRITES) pending.shift()

  pending.push(item)
}

/**
 * Reports whether this change is a write the hook itself made, forgetting the
 * record when it is. A backend reports a write to every listener, the one that
 * made it included, and applying that echo is the storage-to-state re-sync this
 * hook was rebuilt without, arriving by another road: it decodes the entry again
 * and hands the caller an equal value with a new identity, plus a render for a
 * value it already holds.
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
function consumeOwnWriteEcho(entry: string, pendingOwnWrites: React.RefObject<string[]>): boolean {
  const matched = pendingOwnWrites.current.indexOf(entry)

  if (matched === -1) return false

  // Everything recorded before the reported entry goes with it: a backend applies
  // writes in the order it took them and reports them in that order too, so a
  // record still unmatched by now has no echo left to wait for.
  pendingOwnWrites.current.splice(0, matched + 1)

  return true
}

// Builds the change handler. Not a hook, despite living next to one.
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

      // Ahead of the echo check, which needs an entry to match and a removal has
      // none. A removal is never one of this hook's own writes anyway: only the
      // entries it stores are recorded.
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
  // A removal restores the initial value the hook holds now, the same one the
  // key-change path reads, so a caller whose default travels with its data gets
  // that record's default back rather than the mounted one. Tracked through a ref
  // rather than a dependency because an inline object or factory has a new
  // identity every render, which would tear the subscription down and rebuild it;
  // written during render, as the key the hook is rendering for is.
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
