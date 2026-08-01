import type { StorageChange } from '../@types/storage'

/** An adapter waiting for DOM storage events about the area it wraps. */
export interface StorageEventRoute {
  storage: globalThis.Storage
  fire(changes: { [key: string]: StorageChange }): void
}

const routes = new Set<StorageEventRoute>()

let subscription: ((event: StorageEvent) => void) | null = null

function routeStorageEvent(event: StorageEvent): void {
  if (!event.key) return

  const changes = {
    [event.key]: {
      newValue: event.newValue,
      oldValue: event.oldValue,
    },
  }

  for (const route of routes) {
    // An event a consumer synthesized often cannot name an area, so those still reach every route.
    if (event.storageArea == null || event.storageArea === route.storage) {
      route.fire(changes)
    }
  }
}

// A runtime can provide half the DOM event API, and subscribing where nothing can unsubscribe strands a listener.
function canSubscribe(): boolean {
  return typeof globalThis.addEventListener === 'function' && typeof globalThis.removeEventListener === 'function'
}

/** Starts routing DOM storage events to `route`. Every adapter shares one subscription on the global object. */
export function addRoute(route: StorageEventRoute): void {
  routes.add(route)

  if (!subscription && canSubscribe()) {
    subscription = routeStorageEvent

    globalThis.addEventListener('storage', subscription)
  }
}

/** Stops routing to `route`, releasing the shared subscription with the last one. */
export function removeRoute(route: StorageEventRoute): void {
  routes.delete(route)

  if (routes.size === 0 && subscription) {
    globalThis.removeEventListener('storage', subscription)

    subscription = null
  }
}
