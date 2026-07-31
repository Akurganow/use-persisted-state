import type { Storage, StorageChange, StorageChangeEvent } from '../@types/storage'
import { createChangeNotifier } from './change-notifier'
import { addRoute, removeRoute, type StorageEventRoute } from './storage-event-router'

function toKeyList(keys: string | string[]): string[] {
  return Array.isArray(keys) ? keys : [keys]
}

/**
 * Adapts a Web Storage area to the library's `Storage` contract.
 *
 * Pass `undefined` where the global is missing, as it is on a server: the
 * adapter then reads back nothing and **silently discards every write**, so a
 * consumer keeps its initial value instead of the import throwing. Listeners
 * are still accepted and reported, they simply never fire.
 */
export default (storage: globalThis.Storage | undefined): Storage => {
  // Per-instance notifier: the localStorage and sessionStorage adapters must not
  // share listeners, or a write to one area notifies subscribers of the other.
  const notifier = createChangeNotifier()

  // Only a missing global is inert. Anything else a caller passes has to fail
  // on first use instead of swallowing their writes.
  if (storage === undefined) {
    return {
      get: () => ({}),
      set: () => {},
      remove: () => {},
      onChanged: notifier.onChanged,
    }
  }

  const route: StorageEventRoute = { storage, fire: notifier.fire }

  // The DOM subscription is shared and reference counted: an adapter joins it
  // with its first listener and lets go with its last, so factory calls nobody
  // listens to leave nothing attached to the global object.
  const onChanged: StorageChangeEvent = {
    addListener(listener) {
      notifier.onChanged.addListener(listener)

      addRoute(route)
    },
    removeListener(listener) {
      notifier.onChanged.removeListener(listener)

      if (!notifier.hasListeners()) removeRoute(route)
    },
    hasListener(listener) {
      return notifier.onChanged.hasListener(listener)
    },
  }

  return {
    get: keys => {
      const result: { [key: string]: string } = {}

      for (const key of toKeyList(keys)) {
        const item = storage.getItem(key)

        // `null` is the only answer that means absence: an empty string is a
        // value the caller stored, and reporting it as a missing key loses it.
        if (item !== null) result[key] = item
      }

      return result
    },
    set: items => {
      const changes: { [key: string]: StorageChange } = {}

      for (const [key, value] of Object.entries(items)) {
        const oldValue = storage.getItem(key)

        storage.setItem(key, value)

        changes[key] = {
          oldValue,
          newValue: value,
        }
      }

      if (Object.keys(changes).length > 0) notifier.fire(changes)
    },
    remove: keys => {
      const changes: { [key: string]: StorageChange } = {}

      for (const key of toKeyList(keys)) {
        const oldValue = storage.getItem(key)

        storage.removeItem(key)

        changes[key] = {
          oldValue,
          newValue: null,
        }
      }

      if (Object.keys(changes).length > 0) notifier.fire(changes)
    },
    onChanged,
  }
}
