import { StorageChange, StorageChangeEvent, StorageChangeListener } from '../@types/storage'

const TRACKED_AREAS = ['local', 'sync', 'managed'] as const

export type Area = (typeof TRACKED_AREAS)[number]

// Both browsers also report `session` changes, an area this library does not
// expose. Dispatching one would read an undefined listener set and throw.
function isTrackedArea(area: string): area is Area {
  return (TRACKED_AREAS as readonly string[]).includes(area)
}

/**
 * Extension storage holds arbitrary JSON, while this library only ever writes
 * serialized strings. Anything else under a key belongs to other code and is
 * reported as absent — which is what effectively happened before, once such a
 * value reached `JSON.parse` and the hook fell back to its initial value.
 */
export function toStoredValue(value: unknown): string | null | undefined {
  if (value === undefined) return undefined

  return typeof value === 'string' ? value : null
}

export function toStorageChanges(
  changes: { [key: string]: { oldValue?: unknown; newValue?: unknown } },
): { [key: string]: StorageChange } {
  const result: { [key: string]: StorageChange } = {}

  Object.entries(changes).forEach(([key, change]) => {
    result[key] = {
      oldValue: toStoredValue(change.oldValue),
      newValue: toStoredValue(change.newValue),
    }
  })

  return result
}

export function toStoredItems(items: { [key: string]: unknown }): { [key: string]: string } {
  const result: { [key: string]: string } = {}

  Object.entries(items).forEach(([key, value]) => {
    if (typeof value === 'string') result[key] = value
  })

  return result
}

/**
 * Per-area subscriber registry shared by the extension adapters. Each adapter
 * owns its own registry, so a change in one browser's storage never reaches
 * listeners registered on another's.
 */
export function createListenerRegistry() {
  const listeners: { [area in Area]: Set<StorageChangeListener> } = {
    local: new Set<StorageChangeListener>(),
    sync: new Set<StorageChangeListener>(),
    managed: new Set<StorageChangeListener>(),
  }

  return {
    fire(changes: { [key: string]: StorageChange }, area: string): void {
      if (!isTrackedArea(area)) return

      listeners[area].forEach(listener => {
        listener(changes)
      })
    },
    createOnChanged(area: Area): StorageChangeEvent {
      return {
        addListener(listener) {
          listeners[area].add(listener)
        },
        removeListener(listener) {
          listeners[area].delete(listener)
        },
        hasListener(listener) {
          return listeners[area].has(listener)
        },
      }
    },
  }
}
