import { isFunction, isObject } from '@plq/is'

/** Resolves a hook's starting value by key presence, so a persisted `null` is not mistaken for an absence. */
export default function getPersistedValue<T>(key: string, initialValue: T | (() => T), persist?: string): T {
  let initialPersist: unknown

  try {
    initialPersist = persist ? JSON.parse(persist) : {}
  } catch (err) {
    // A shared backend can hold a foreign or truncated entry, so a parse failure must not stop the mount.
    console.error("use-persisted-state: Can't parse value from storage", err)

    initialPersist = {}
  }

  let initialOrPersistedValue = isFunction(initialValue) ? initialValue() : initialValue

  // `in` throws on a primitive, and this runs in the `useState` initializer, where a throw stops the mount.
  if (isObject(initialPersist) && key in initialPersist) {
    initialOrPersistedValue = initialPersist[key] as T
  }

  return initialOrPersistedValue
}
