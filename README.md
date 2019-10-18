# usePersistedState

Persists the state to localStorage, sessionStorage or anything else that implements `getItem`, `setItem` and `removeItem`

## Example

```jsx
import createPersistedState from '@plq/use-persisted-state'

const [usePersistedState] = createPersistedState('example')

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

Little bit closer to real life:

[![Edit @plq/use-persisted-state](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/plquse-persisted-state-ob2od?fontsize=14)

## Requirement
To use `@plq/use-persisted-state`, you must use `react@16.8.0` or greater which includes Hooks.

## Clear Storage
```jsx
import createPersistedState from '@plq/use-persisted-state'

const [usePersistedState, clear] = createPersistedState('example')

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

const [usePersistedState] = createPersistedState('example', window.sessionStorage)

export default function App() {
  const [count, setCount] = usePersistedState('count', 0)
  const increment = () => setCount(prevCount => prevCount + 1)

  return (
    <div>
      {count}
      <button onClick={increment}>+</button>
    </div>
  )
}

```
## Use custom storage
```jsx
import createPersistedState from '@plq/use-persisted-state'

const myStorage = {
  getItem: (key) => getItemFromSomeStorage(key)
  setItem: (key, value) => setItemToSomeStorage(key, value)
  removeItem: (key) => removeItemFromSomeStorage(key)
}

const [usePersistedState] = createPersistedState('example', myStorage)

export default function App() {
  const [count, setCount] = usePersistedState('count', 0)
  const increment = () => setCount(prevCount => prevCount + 1)

  return (
    <div>
      {count}
      <button onClick={increment}>+</button>
    </div>
  )
}

```

## ToDo
- Support **async** storage
