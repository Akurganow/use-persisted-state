import { isFunction } from '@plq/is'
import parsePersistedEntry, { hasOwnPersistedKey, type PersistedEntry } from './parse-persisted-entry'

/** Resolves a hook's starting value by key presence, so a persisted `null` is not mistaken for an absence. */
export default function getPersistedValue<T>(key: string, initialValue: T | (() => T), persist?: string): T {
  let initialPersist: PersistedEntry

  try {
    initialPersist = parsePersistedEntry(persist)
  } catch (err) {
    // A shared backend can hold a foreign or truncated entry, so a parse failure must not stop the mount.
    console.error("use-persisted-state: Can't parse value from storage", err)

    initialPersist = {}
  }

  let initialOrPersistedValue = isFunction(initialValue) ? initialValue() : initialValue

  if (hasOwnPersistedKey(initialPersist, key)) {
    initialOrPersistedValue = initialPersist[key] as T
  }

  return initialOrPersistedValue
}
