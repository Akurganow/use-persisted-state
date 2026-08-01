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
  hook key. A write replaces all of it, so on an asynchronous storage the library takes one change
  to that key at a time — writes and `clear` alike: your `set` is never called for an entry merged
  from a snapshot another write has since replaced, and a removal is never undone by a write that
  was already queued behind it. An entry the library cannot read — a string that will not parse, or
  one that parses to something other than a JSON object — is left untouched instead: the write is
  reported and skipped.
- **The refusal reaches only as far as `get` reports.** An adapter that narrows a value to absent
  hides it from that check, and the next write replaces it. This is what the bundled extension
  adapters do with the non-string values their backend allows, so a foreign object under a
  `persisted_state_hook:` key in extension storage is overwritten rather than preserved. An adapter
  that wants a foreign value protected has to return it from `get` as the string it is.
- **Detection reads, and never writes.** The default export tells `Storage` and `AsyncStorage` apart
  from the shape of your methods first: a `get` declared `async` settles it without any call. Only
  when that does not hold does it call `get('')` once, as a method of your storage, and check whether
  the result is a `Promise`. All three members must be functions — a promise stored in place of one
  is not a method and is rejected. `set` and `remove` are examined for shape but never invoked, so
  detection cannot change what your backend holds. The probe's result is discarded; a rejection from
  it is handled rather than left to terminate the consuming process on Node 15+, and a `get` that
  throws outright is reported as not asynchronous instead of taking the import down. If even a read
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
