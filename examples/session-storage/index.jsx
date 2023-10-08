import React from 'react'
import { createRoot } from 'react-dom/client'

import createPersistedState from '../../lib'
import storage from '../../lib/storages/session-storage'

const [usePersistedState, clear] = createPersistedState('session_example', storage)
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

const container = document.getElementById('root')
const root = createRoot(container)

root.render(<App />)
