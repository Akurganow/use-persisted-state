import parsePersistedEntry from './parse-persisted-entry'

/**
 * Merges `newValue` under `key` into the shared entry and serializes the result.
 *
 * A parse failure propagates: the caller owns an entry this must not rebuild.
 */
export default function getNewItem<T>(key: string, persistedItem: string | undefined, newValue: T): string {
  const persist = parsePersistedEntry(persistedItem)

  // Spread and a computed key define own properties; assigning instead would lose
  // a sibling hook's `__proto__` key. See PersistedEntry.
  return JSON.stringify({ ...persist, [key]: newValue })
}
