# Storage API

A storage backend is a plain object the library talks to. The API is similar to the WebExtensions
[`browser.storage`](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/storage) API,
with a few differences.

There are two variants of the contract, defined in
[`src/@types/storage.ts`](../src/@types/storage.ts):

- **`Storage`** — synchronous: methods return plain values.
- **`AsyncStorage`** — asynchronous: the same methods return `Promise`s.

The default `createPersistedState` export accepts either and detects which one it received;
the named `createPersistedState` / `createAsyncPersistedState` factories each accept exactly one.

## Methods

### `get(keys: string | string[]): { [key: string]: string }`

Retrieves one or more items from the storage. Returns an object with one property per key that
exists in the storage; keys without a stored value are simply absent from the result. For
`AsyncStorage` the same object is returned wrapped in a `Promise`.

### `set(items: { [key: string]: string }): void`

Stores one or more items. Each property of `items` is a key/value pair to write. For
`AsyncStorage` returns `Promise<void>`.

### `remove(keys: string | string[]): void`

Removes one or more items from the storage. For `AsyncStorage` returns `Promise<void>`.

## `onChanged`

An event object the library subscribes to so that hooks react to changes made outside of the
current hook instance — by another component, another tab, or other code writing to the same
backend.

### `addListener(listener)`

Adds a listener to the storage change event.

### `removeListener(listener)`

Stops listening to the storage change event. The `listener` argument is the listener to remove.

### `hasListener(listener)`

Checks whether `listener` is registered for this event. Returns `true` if it is listening,
`false` otherwise.

### Listener signature

```ts
type StorageChangeListener = (changes: { [key: string]: StorageChange }) => void

interface StorageChange {
  oldValue?: string | null
  newValue?: string | null
}
```

`changes` maps each changed storage key to its old and new values. When a key is removed, fire the
listener with a `newValue` of `null` (or omit it) and the previous stored string in `oldValue` —
the library treats that as a removal and resets affected hooks to their initial values. A removal
reported without an `oldValue` is ignored.

## Contract notes

- **Values are strings.** The library serializes state with `JSON.stringify` before calling `set`
  and expects `get` to return exactly the strings that were stored. An adapter must not parse or
  transform values. If the underlying backend can hold non-string data (as extension storage can),
  the adapter should narrow rather than widen the contract: the bundled adapters omit foreign
  values from `get`, and report them as `null` in `onChanged`, which the library reads as a
  removal — see
  [`src/utils/extension-storage.ts`](../src/utils/extension-storage.ts) for how the bundled
  adapters do this.
- **One entry per factory.** Each `createPersistedState(name, storage)` factory reads and writes a
  single storage key, `persisted_state_hook:<name>`, containing a JSON object with one property per
  hook key.
- **Detection reads, and never writes.** The default export tells `Storage` and `AsyncStorage` apart
  from the shape of your methods first: a `get` declared `async`, or one that is already a `Promise`,
  settles it without any call. Only when neither holds does it call `get('')` once and check whether
  the result is a `Promise`. `set` and `remove` are examined for shape but never invoked, so
  detection cannot change what your backend holds. The probe's result is discarded, and a rejection
  from it is handled rather than left to terminate the consuming process on Node 15+. If even a read
  during setup is undesirable, use the named factories, which skip detection.

## Example

```js
const storageListeners = new Set()

onChangeSomeStorage(event => {
  const changes = {
    [event.key]: {
      newValue: event.newValue,
      oldValue: event.oldValue,
    },
  }

  for (const listener of storageListeners) {
    listener(changes)
  }
})

const myStorage = {
  get: keys => getItemsFromSomeStorage(keys),
  set: items => setItemsToSomeStorage(items),
  remove: keys => removeItemsFromSomeStorage(keys),
  onChanged: {
    addListener: listener => storageListeners.add(listener),
    removeListener: listener => storageListeners.delete(listener),
    hasListener: listener => storageListeners.has(listener),
  },
}
```

TypeScript users can import the contract types from the entry point:

```ts
import type {
  AsyncStorage,
  Storage,
  StorageChange,
  StorageChangeEvent,
  StorageChangeListener,
} from '@plq/use-persisted-state'
```

The longer `@plq/use-persisted-state/lib/@types/storage` path that earlier versions documented
continues to work and resolves to the same types. Prefer the entry point: `lib/` is kept open for
compatibility only, and is the one path `check:attw` does not verify.
