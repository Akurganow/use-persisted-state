import React, { useState } from 'react'
import { render } from 'react-dom'

import createPersistedState from '../../lib'
import storage from '../../lib/storages/local-storage'

const [usePersistedState, clear] = createPersistedState('local_example', storage)
const initialValue = 0

function Actions() {
  const [key, setKey] = useState('count')
  const [, setCount] = usePersistedState(key, initialValue)

  const handleChange = event => {
    const { value } = event.target

    setKey(value)
  }

  return (
    <div>
      <div>
        <select onChange={handleChange} defaultValue="count">
          <option value="count">Count</option>
          <option value="number">Number</option>
        </select>
      </div>
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
  const [number] = usePersistedState('number', initialValue)

  return (
    <div>Count:{count} Number:{number}</div>
  )

}

function App() {
  return (
    <div>
      <Count />
      <hr />
      <Actions />
    </div>
  )
}

const root = document.getElementById('root')

render(<App />, root)
