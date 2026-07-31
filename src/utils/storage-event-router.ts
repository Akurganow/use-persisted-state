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
    // A browser always names the area it changed, so real cross-tab events
    // reach only the adapter of that area. An event a consumer synthesized —
    // the sole way to test cross-tab sync under jsdom, and a common way to
    // notify the writing tab in production — often cannot name one: the
    // StorageEvent constructor rejects a mocked storage there. Those still go
    // everywhere, exactly as they did before areas were told apart.
    if (event.storageArea == null || event.storageArea === route.storage) {
      route.fire(changes)
    }
  }
}

// A runtime can provide storage without the DOM event API, and can provide half
// of that API: subscribing where nothing can unsubscribe strands a listener and
// makes releasing it throw, so both halves are required before taking one.
function canSubscribe(): boolean {
  return typeof globalThis.addEventListener === 'function' && typeof globalThis.removeEventListener === 'function'
}

/**
 * Starts routing DOM storage events to `route`. Every adapter shares one
 * subscription on the global object, so creating adapters nobody listens to
 * costs nothing.
 */
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
