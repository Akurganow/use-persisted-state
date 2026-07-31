import { isFunction, isObject } from '@plq/is'

/**
 * Resolves the value a hook starts from: the persisted entry for `key` when the stored payload
 * carries one, the initial value otherwise.
 *
 * Presence is decided by the key rather than by the value, so a persisted `null` comes back as
 * the value the user set instead of being mistaken for an absence and replaced.
 */
export default function getPersistedValue<T>(key: string, initialValue: T | (() => T), persist?: string): T {
  let initialPersist: unknown

  try {
    initialPersist = persist ? JSON.parse(persist) : {}
  } catch (err) {
    // A shared backend can hold a foreign or truncated entry, so a parse failure is expected here
    // and must not stop the component mounting. It is reported rather than swallowed because the
    // fallback discards whatever was persisted, and because the change path logs the same failure.
    console.error("use-persisted-state: Can't parse value from storage", err)

    initialPersist = {}
  }

  let initialOrPersistedValue = isFunction(initialValue) ? initialValue() : initialValue

  // `JSON.parse` yields any JSON value, so a foreign entry can be a primitive,
  // and `in` throws on one. This runs in the `useState` initializer, where a
  // throw stops the component mounting instead of falling back.
  if (isObject(initialPersist) && key in initialPersist) {
    initialOrPersistedValue = initialPersist[key] as T
  }

  return initialOrPersistedValue
}
