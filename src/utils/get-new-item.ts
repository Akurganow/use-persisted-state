import { isObject } from '@plq/is'

/**
 * Merges `newValue` under `key` into the serialized entry a factory shares between all of its
 * hooks, and returns the entry to store.
 *
 * Reports and throws when the entry cannot be merged into, rather than answering with one built
 * from nothing. What this returns is written over the whole entry, so an unreadable entry is the
 * one case with nothing safe to return: every other hook's key would be replaced with nothing,
 * and the bytes a repair still needs would go with them.
 *
 * @throws {SyntaxError} when the entry is not valid JSON.
 * @throws {TypeError} when the entry is valid JSON but not an object of keys.
 */
export default function getNewItem<T>(key: string, persistedItem: string, newValue: T): string {
  let persist: unknown

  try {
    persist = persistedItem ? JSON.parse(persistedItem) : {}
  } catch (err) {
    console.error("use-persisted-state: Can't write value to storage", err)

    throw err
  }

  if (!isObject(persist)) {
    // A shared backend can leave any JSON under the key, and neither a primitive nor an array
    // survives being merged into: `JSON.stringify` unwraps the first back to itself and keeps the
    // second an array, so the value being set disappears with the property added to it. A stored
    // `null` did not even get that far - it threw out of `Object.assign` and into the caller.
    const err = new TypeError('the stored entry is not an object of keys')

    console.error("use-persisted-state: Can't write value to storage", err)

    throw err
  }

  return JSON.stringify({ ...persist, [key]: newValue })
}
