import type { StorageChange, StorageChangeEvent, StorageChangeListener } from '../@types/storage'

export interface ChangeNotifier {
  fire(changes: { [key: string]: StorageChange }): void
  hasListeners(): boolean
  onChanged: StorageChangeEvent
}

/** Holds the subscribers of a single change source, so a change never reaches listeners that subscribed elsewhere. */
export function createChangeNotifier(): ChangeNotifier {
  const listeners = new Set<StorageChangeListener>()

  return {
    fire(changes) {
      for (const listener of listeners) {
        listener(changes)
      }
    },
    hasListeners() {
      return listeners.size > 0
    },
    onChanged: {
      addListener(listener) {
        listeners.add(listener)
      },
      removeListener(listener) {
        listeners.delete(listener)
      },
      hasListener(listener) {
        return listeners.has(listener)
      },
    },
  }
}
