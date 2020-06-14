# usePersistedState

Persists the state to localStorage, sessionStorage or any custom storage

## Features

- Persist the state to `localStorage`, `sessionStorage` or almost anything else implements [storage API](https://github.com/Akurganow/use-persisted-state/blob/master/docs/storage-api.md)
- The state factory takes as many keys as needed, so you don't have to call the factory for each variable
- Written with the Typescript, the definitions go with the library
- No dependencies

## Example

```jsx
import createPersistedState from '@plq/use-persisted-state'
import storage from '@plq/use-persisted-state/lib/storages/local-storage'

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

[![Edit @plq/use-persisted-state](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/plquse-persisted-state-ob2od?fontsize=14)

## Requirement
To use `@plq/use-persisted-state`, you must use `react@16.8.0` or greater which includes Hooks.

## Clear Storage
```jsx
import createPersistedState from '@plq/use-persisted-state'
import storage from '@plq/use-persisted-state/lib/storages/local-storage'

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
import storage from '@plq/use-persisted-state/lib/storages/session-storage'

const [usePersistedState, clear] = createPersistedState('example', storage)
```
## Use async storage
```jsx
import createPersistedState from '@plq/use-persisted-state'
// or
import { createAsyncPersistedState } from '@plq/use-persisted-state'
import { local } from '@plq/use-persisted-state/lib/storages/browser-storage'

const [usePersistedState, clear] = createPersistedState('example', local)
```
## Use custom storage

The [storage API](https://github.com/Akurganow/use-persisted-state/blob/master/docs/storage-api.md) is similar to the browser.storage but with a few exceptions

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
    
  listeners.forEach(listener => {
    listener(changes)
  })
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
