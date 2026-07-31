import type { StorageChange, StorageChangeEvent } from '../@types/storage'
import { type ChangeNotifier, createChangeNotifier } from './change-notifier'

const TRACKED_AREAS = ['local', 'sync', 'managed'] as const

export type Area = (typeof TRACKED_AREAS)[number]

// Both browsers also report `session` changes, an area this library does not
// expose. Dispatching one would read an undefined notifier and throw.
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
  if (value === undefined) return

  return typeof value === 'string' ? value : null
}

export function toStorageChanges(changes: { [key: string]: { oldValue?: unknown; newValue?: unknown } }): {
  [key: string]: StorageChange
} {
  const result: { [key: string]: StorageChange } = {}

  for (const [key, change] of Object.entries(changes)) {
    result[key] = {
      oldValue: toStoredValue(change.oldValue),
      newValue: toStoredValue(change.newValue),
    }
  }

  return result
}

export function toStoredItems(items: { [key: string]: unknown }): { [key: string]: string } {
  const result: { [key: string]: string } = {}

  for (const [key, value] of Object.entries(items)) {
    if (typeof value === 'string') result[key] = value
  }

  return result
}

export interface ListenerRegistry {
  fire(changes: { [key: string]: StorageChange }, area: string): void
  createOnChanged(area: Area): StorageChangeEvent
}

/**
 * Demultiplexes an extension's single `onChanged` event, which names the area
 * that changed, to one notifier per area. Each adapter owns its own registry,
 * so a change in one browser's storage never reaches listeners registered on
 * another's.
 */
export function createListenerRegistry(): ListenerRegistry {
  const notifiers: { [area in Area]: ChangeNotifier } = {
    local: createChangeNotifier(),
    sync: createChangeNotifier(),
    managed: createChangeNotifier(),
  }

  return {
    fire(changes, area) {
      if (!isTrackedArea(area)) return

      notifiers[area].fire(changes)
    },
    createOnChanged(area) {
      return notifiers[area].onChanged
    },
  }
}
