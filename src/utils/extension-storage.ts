import type { StorageChange, StorageChangeEvent } from '../@types/storage'
import { type ChangeNotifier, createChangeNotifier } from './change-notifier'

const TRACKED_AREAS = ['local', 'sync', 'managed'] as const

export type Area = (typeof TRACKED_AREAS)[number]

// Both browsers also report `session`, an area this library does not expose; dispatching one would throw.
function isTrackedArea(area: string): area is Area {
  return (TRACKED_AREAS as readonly string[]).includes(area)
}

/** Extension storage holds arbitrary JSON; this library writes only strings, so anything else reads as absent. */
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

/** Demultiplexes an extension's single `onChanged` event to one notifier per area, one registry per adapter. */
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
