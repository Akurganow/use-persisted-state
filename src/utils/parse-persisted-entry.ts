import { isObject } from '@plq/is'

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
    throw new TypeError('the stored entry is not an object of hook keys')
  }

  return parsed
}
