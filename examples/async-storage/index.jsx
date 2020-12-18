import React from 'react'
import { render } from 'react-dom'

import createPersistedState from '../../lib'

let listeners = []

function fireStorageEvent(changes) {
  listeners.forEach(listener => {
    listener(changes)
  })
}

window.addEventListener('storage', event => {
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
  get: keys => new Promise(resolve => {
    const result = {}

    if (Array.isArray(keys)) {
      keys.forEach(key => {
        const item = localStorage.getItem(key)

        if (item) result[key] = item
      })
    } else {
      const item = localStorage.getItem(keys)

      if (item) result[keys] = item
    }

    resolve(result)
  }),
  set: items => new Promise(resolve => {
    const changes = {}

    Object.entries(items).forEach(([key, value]) => {
      const oldValue = localStorage.getItem(key)

      localStorage.setItem(key, value)

      changes[key] = {
        oldValue,
        newValue: value,
      }
    })

    fireStorageEvent(changes)

    resolve()
  }),
  remove: keys => new Promise(resolve => {
    const changes = {}

    if (Array.isArray(keys)) {
      keys.forEach(key => {
        const oldValue = localStorage.getItem(key)

        localStorage.removeItem(key)

        changes[key] = {
          oldValue,
          newValue: null,
        }
      })
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
        onClick={() => {
          setCount(prevCount => prevCount - 1)
        }}>
        -
      </button>
      <button onClick={() => { clear() }}>Clear</button>
      <button onClick={() => { setCount(initialValue) }}>Initial</button>
      <button
        onClick={() => {
          setCount(prevCount => prevCount + 1)
        }}>
        +
      </button>
    </div>
  )
}

function Count() {
  const [count] = usePersistedState('count', initialValue)

  return (
    <div>{count}</div>
  )

}

function App() {
  return (
    <div>
      <Count />
      <Actions />
    </div>
  )
}

const root = document.getElementById('root')

render(<App />, root)
