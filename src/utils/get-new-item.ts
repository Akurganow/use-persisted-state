import { isObject } from '@plq/is'

/** Merges `newValue` under `key` into the shared entry, throwing rather than rebuilding one it cannot read. */
export default function getNewItem<T>(key: string, persistedItem: string, newValue: T): string {
  let persist: unknown

  try {
    persist = persistedItem ? JSON.parse(persistedItem) : {}
  } catch (err) {
    console.error("use-persisted-state: Can't write value to storage", err)

    throw err
  }

  if (!isObject(persist)) {
    // Neither a primitive nor an array survives being merged into: the value being set would disappear.
    const err = new TypeError('the stored entry is not an object of keys')

    console.error("use-persisted-state: Can't write value to storage", err)

    throw err
  }

  return JSON.stringify({ ...persist, [key]: newValue })
}
