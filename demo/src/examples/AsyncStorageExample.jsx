import React from 'react'
import createPersistedState from '@plq/use-persisted-state'

let listeners = []

function fireStorageEvent(changes) {
  for (const listener of listeners) {
    listener(changes)
  }
}

globalThis.addEventListener('storage', event => {
  if (event.key) {
    const changes = {
      [event.key]: {
        newValue: event.newValue,
        oldValue: event.oldValue,
      },
    }

    fireStorageEvent(changes)
  }
})

const storage = {
  get: keys =>
    new Promise(resolve => {
      const result = {}

      if (Array.isArray(keys)) {
        for (const key of keys) {
          const item = localStorage.getItem(key)

          if (item) result[key] = item
        }
      } else {
        const item = localStorage.getItem(keys)

        if (item) result[keys] = item
      }

      resolve(result)
    }),
  set: items =>
    new Promise(resolve => {
      const changes = {}

      for (const [key, value] of Object.entries(items)) {
        const oldValue = localStorage.getItem(key)

        localStorage.setItem(key, value)

        changes[key] = {
          oldValue,
          newValue: value,
        }
      }

      fireStorageEvent(changes)

      resolve()
    }),
  remove: keys =>
    new Promise(resolve => {
      const changes = {}

      if (Array.isArray(keys)) {
        for (const key of keys) {
          const oldValue = localStorage.getItem(key)

          localStorage.removeItem(key)

          changes[key] = {
            oldValue,
            newValue: null,
          }
        }
      } else {
        const oldValue = localStorage.getItem(keys)

        localStorage.removeItem(keys)

        changes[keys] = {
          oldValue,
          newValue: null,
        }
      }

      fireStorageEvent(changes)

      resolve()
    }),
  onChanged: {
    addListener(listener) {
      listeners.push(listener)
    },
    removeListener(listener) {
      listeners = listeners.filter(l => l === listener)
    },
    hasListener(listener) {
      return listeners.includes(listener)
    },
  },
}

const [usePersistedState, clear] = createPersistedState('async_example', storage)
const initialValue = 0

function Actions() {
  const [, setCount] = usePersistedState('count', initialValue)

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setCount(prevCount => prevCount - 1)
        }}
      >
        -
      </button>
      <button
        type="button"
        onClick={() => {
          clear()
        }}
      >
        Clear
      </button>
      <button
        type="button"
        onClick={() => {
          setCount(initialValue)
        }}
      >
        Initial
      </button>
      <button
        type="button"
        onClick={() => {
          setCount(prevCount => prevCount + 1)
        }}
      >
        +
      </button>
    </div>
  )
}

function Count() {
  const [count] = usePersistedState('count', initialValue)

  return <div>{count}</div>
}

function AsyncStorageExample() {
  return (
    <div>
      <h3>Async Storage Example</h3>
      <p>This example demonstrates async storage with custom event handling.</p>
      <Count />
      <Actions />
    </div>
  )
}

export default AsyncStorageExample
