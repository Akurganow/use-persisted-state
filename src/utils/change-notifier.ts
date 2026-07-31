import type { StorageChange, StorageChangeEvent, StorageChangeListener } from '../@types/storage'

export interface ChangeNotifier {
  fire(changes: { [key: string]: StorageChange }): void
  hasListeners(): boolean
  onChanged: StorageChangeEvent
}

/**
 * Holds the subscribers of a single change source. Each adapter — and, for the
 * extension backends, each storage area — owns one, so a change never reaches
 * listeners that subscribed elsewhere.
 *
 * Routing a backend's events to the right notifier stays with the adapter: the
 * extensions demultiplex one event by area name, the DOM one by storage object.
 */
export function createChangeNotifier(): ChangeNotifier {
  const listeners = new Set<StorageChangeListener>()

  return {
    fire(changes) {
      for (const listener of listeners) {
        listener(changes)
      }
    },
    // Lets an adapter release a shared resource once nobody is listening; the
    // set behind onChanged stays the only count, so the two cannot drift.
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
