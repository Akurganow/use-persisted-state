# usePersistedState

[![npm version](https://badge.fury.io/js/@plq%2Fuse-persisted-state.svg)](https://www.npmjs.com/package/@plq/use-persisted-state)
[![Tests](https://github.com/Akurganow/use-persisted-state/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/Akurganow/use-persisted-state/actions/workflows/main.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-support-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/akurganow)

A React `useState` that persists to `localStorage`, `sessionStorage`, extension storage (`browser.storage` / `chrome.storage`), or any custom backend.

## Features

- Persist state to `localStorage`, `sessionStorage`, extension storage, or almost anything else that implements the [storage API](https://github.com/Akurganow/use-persisted-state/blob/main/docs/storage-api.md)
- One state factory serves as many keys as needed, so you don't have to call the factory for each variable
- Supports both synchronous and asynchronous storage backends
- Components using the same key stay in sync; with the `localStorage` adapter, changes also propagate across browser tabs
- Written in TypeScript — type definitions ship with the package
- A single tiny runtime dependency: [`@plq/is`](https://www.npmjs.com/package/@plq/is)

## Requirements

To use `@plq/use-persisted-state`, you must use `react@16.8.0` or greater, which includes Hooks.
The library is tested against React 19. The peer range allows React 16.8 and above, though only 19 is exercised in CI.

## Install

```sh
npm install @plq/use-persisted-state
```

## Quick start

```jsx
import createPersistedState from '@plq/use-persisted-state'
import storage from '@plq/use-persisted-state/storages/local-storage'

const [usePersistedState] = createPersistedState('example', storage)

export default function App() {
  const [count, setCount] = usePersistedState('count', 0)
  const handleIncrement = () => setCount(prevCount => prevCount + 1)

  return (
    <div>
      {count}
      <button onClick={handleIncrement}>+</button>
    </div>
  )
}
```

To try it locally, run the demo app from a repository checkout: `npm ci && npm run demo`.

## API

### `createPersistedState(name, storage)` — default export

```ts
const [usePersistedState, clear] = createPersistedState(name, storage)
```

- `name` — a namespace for this factory. All keys created by the returned hook are stored together in a single storage entry named `persisted_state_hook:<name>`.
- `storage` — a synchronous or asynchronous storage backend implementing the [storage API](https://github.com/Akurganow/use-persisted-state/blob/main/docs/storage-api.md).

Returns a `[usePersistedState, clear]` tuple. The default export detects whether the backend is asynchronous by probing it: each of `get`, `set` and `remove` is called once (`get('')`, `set({})`, `remove('')`) to see whether it returns a `Promise`. If your backend must not be called during setup, import one of the named factories below instead — they skip detection entirely.

### Named factories

```ts
import { createPersistedState, createAsyncPersistedState } from '@plq/use-persisted-state'
```

- `createPersistedState(name, storage)` — for synchronous backends only (`localStorage`, `sessionStorage`).
- `createAsyncPersistedState(name, storage)` — for asynchronous backends only (`browser.storage`, `chrome.storage`, custom promise-based backends).

### `usePersistedState(key, initialValue)`

```ts
const [state, setState] = usePersistedState(key, initialValue)
```

Works like `useState`: returns the current state and a setter that accepts either a value or an updater function (`prev => next`). In addition, every update is written to the storage backend, and external changes to the stored value update the state.

- Values are serialized with `JSON.stringify`, so they must be JSON-serializable (no functions, class instances, `Map`, `Set`, etc.).
- With an asynchronous backend, the hook renders `initialValue` first and updates once the stored value has loaded.

### `clear()`

Removes the factory's whole storage entry. Hooks created by that factory fall back to their initial values. Returns `void` for synchronous backends and `Promise<void>` for asynchronous ones.

### TypeScript

The package ships its own type definitions. When writing a custom backend, the storage contract types can be imported directly:

```ts
import type { Storage, AsyncStorage } from '@plq/use-persisted-state/lib/@types/storage'
```

## Clear storage

```jsx
import createPersistedState from '@plq/use-persisted-state'
import storage from '@plq/use-persisted-state/storages/local-storage'

const [usePersistedState, clear] = createPersistedState('example', storage)

export default function App() {
  const [count, setCount] = usePersistedState('count', 0)
  const increment = () => setCount(prevCount => prevCount + 1)

  return (
    <div>
      {count}
      <button onClick={increment}>+</button>
      <button onClick={clear}>Clear</button>
    </div>
  )
}
```

## Use sessionStorage

```jsx
import createPersistedState from '@plq/use-persisted-state'
import storage from '@plq/use-persisted-state/storages/session-storage'

const [usePersistedState, clear] = createPersistedState('example', storage)
```

## Use async storage

```jsx
import createPersistedState from '@plq/use-persisted-state'
// or, to skip async detection:
import { createAsyncPersistedState } from '@plq/use-persisted-state'
import { local } from '@plq/use-persisted-state/storages/browser-storage'

const [usePersistedState, clear] = createPersistedState('example', local)
```

## Use custom storage

The [storage API](https://github.com/Akurganow/use-persisted-state/blob/main/docs/storage-api.md) is similar to the WebExtensions `browser.storage` API, with a few differences.

```jsx
import createPersistedState from '@plq/use-persisted-state'

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
  }
}

const [usePersistedState, clear] = createPersistedState('example', myStorage)
```

## Storage adapters

The longer `@plq/use-persisted-state/lib/storages/…` paths that earlier versions documented continue
to work. Prefer the shorter ones below: imported from ES module code, the `lib` path hands back the
CommonJS exports object rather than the adapter, so it needs an extra `.default` that the shorter
path does not.

### [localStorage](https://developer.mozilla.org/docs/Web/API/Window/localStorage) `@plq/use-persisted-state/storages/local-storage`

- Useful for the average web application.
- Synchronous. Changes made in other browser tabs are picked up through the [`storage` event](https://developer.mozilla.org/docs/Web/API/Window/storage_event).

### [sessionStorage](https://developer.mozilla.org/docs/Web/API/Window/sessionStorage) `@plq/use-persisted-state/storages/session-storage`

- Useful for state that should not outlive the browser session.
- Synchronous.

### [browser.storage](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/storage) `@plq/use-persisted-state/storages/browser-storage`

- Only for web extensions. Asynchronous.
- Named exports for each storage area: `local`, `sync` and `managed` (note that the [managed area](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/storage/managed) is read-only for the extension).
- Don't forget to set up the [polyfill](https://github.com/mozilla/webextension-polyfill) if you want to run the extension in a Chromium-based browser.
- You need to declare the "storage" [permission](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions) in your `manifest.json` file.

### [chrome.storage](https://developer.chrome.com/docs/extensions/reference/api/storage) `@plq/use-persisted-state/storages/chrome-storage`

- Only for Chromium-based web extensions. Asynchronous.
- Named exports for each storage area: `local`, `sync` and `managed` (the managed area is read-only for the extension).
- If your extension runs only in Chromium-based browsers, you can use this adapter without the polyfill.
- You must declare the "storage" permission in the [extension manifest](https://developer.chrome.com/docs/extensions/reference/manifest) to use this adapter.

```jsx
import createPersistedState from '@plq/use-persisted-state'
import { local } from '@plq/use-persisted-state/storages/chrome-storage'

const [usePersistedState, clear] = createPersistedState('example', local)
```

## Server-side rendering

This library targets browser environments. Two things matter when rendering on a server:

- The bundled `local-storage` and `session-storage` adapters can be imported without `localStorage` / `sessionStorage`. Where the global is missing the adapter reads back nothing and discards every write, so the hook keeps its initial value rather than throwing.
- The synchronous hook reads from storage during render.

When using an SSR framework (Next.js, Remix, etc.), make sure the components using the hook run only on the client — for example, in client-only components or behind a dynamic import that is disabled during SSR.

## How values are stored

Each factory keeps all of its keys in a single storage entry named `persisted_state_hook:<name>`, holding a JSON object with one property per key:

```
persisted_state_hook:example → {"count":0}
```

Storage backends only ever see serialized strings. Anything you persist ends up unencrypted in the underlying storage — do not store secrets or sensitive data (see [SECURITY.md](https://github.com/Akurganow/use-persisted-state/blob/main/SECURITY.md)).

## Known issues

These are defects, not intended behaviour, and are tracked for a fix. They are listed so you are
not caught out by them in the meantime.

- **`null` does not survive a round trip.** Setting a value to `null` writes it to storage, but on
  the next read the hook falls back to the initial value instead of returning `null`. Use a
  sentinel value if you need to represent "empty" today.
- **`undefined` is not persisted.** `JSON.stringify` drops it, so the key disappears and the
  initial value comes back.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](https://github.com/Akurganow/use-persisted-state/blob/main/CONTRIBUTING.md) for setup, testing and the commit convention, and [CODE_OF_CONDUCT.md](https://github.com/Akurganow/use-persisted-state/blob/main/CODE_OF_CONDUCT.md) for community standards.

## License

[MIT](LICENSE)
