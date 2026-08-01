import type { Storage, StorageChange, StorageChangeEvent } from '../@types/storage'
import { createChangeNotifier } from './change-notifier'
import { addRoute, removeRoute, type StorageEventRoute } from './storage-event-router'

function toKeyList(keys: string | string[]): string[] {
  return Array.isArray(keys) ? keys : [keys]
}

/** Adapts a Web Storage area. With `undefined`, as on a server, it reads back nothing and discards every write. */
export default (storage: globalThis.Storage | undefined): Storage => {
  // Per instance: the localStorage and sessionStorage adapters must not share listeners.
  const notifier = createChangeNotifier()

  // Only a missing global is inert; anything else a caller passes has to fail on first use.
  if (storage === undefined) {
    return {
      get: () => ({}),
      set: () => {},
      remove: () => {},
      onChanged: notifier.onChanged,
    }
  }

  const route: StorageEventRoute = { storage, fire: notifier.fire }

  // The DOM subscription is shared and reference counted, so adapters nobody listens to attach nothing.
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

        // `null` is the only answer meaning absence; an empty string is a value the caller stored.
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

        // Nothing was there, so nothing changed. A reported removal resets every
        // hook on the entry, calling a functional initial value to do it.
        if (oldValue === null) continue

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
