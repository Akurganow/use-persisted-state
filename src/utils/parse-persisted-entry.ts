import { isObject } from '@plq/is'

/**
 * A parsed shared entry. Copy one only by spread or a computed key: `Object.assign`
 * and plain assignment reach the `__proto__` accessor on `Object.prototype`, which
 * drops that hook key silently and, for an object value, reparents the entry so
 * that every later lookup on it inherits keys nobody stored.
 */
export type PersistedEntry = Record<string, unknown>

export function hasOwnPersistedKey(entry: PersistedEntry, key: string): boolean {
  // The entry can supply a key named hasOwnProperty, so the prototype method must stay detached.
  // biome-ignore lint/suspicious/noPrototypeBuiltins: Object.hasOwn is unavailable in part of the supported Node 16 range.
  return Object.prototype.hasOwnProperty.call(entry, key)
}

export default function parsePersistedEntry(entry: string | undefined): PersistedEntry {
  if (entry === undefined) return {}

  const parsed: unknown = JSON.parse(entry)

  if (!isObject(parsed)) {
    // Prefixed because this one reaches consumer code: a write propagates it out of the setter.
    throw new TypeError('use-persisted-state: the stored entry is not an object of hook keys')
  }

  return parsed
}
