import parsePersistedEntry from './parse-persisted-entry'

/** Merges `newValue` under `key` into the shared entry, throwing rather than rebuilding one it cannot read. */
export default function getNewItem<T>(key: string, persistedItem: string | undefined, newValue: T): string {
  const persist = parsePersistedEntry(persistedItem)

  return JSON.stringify({ ...persist, [key]: newValue })
}
