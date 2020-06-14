import React from 'react'
import { render } from 'react-dom'

import createPersistedState from '../../lib'
import storage from '../../lib/storages/local-storage'

const [usePersistedState, clear] = createPersistedState('simple_example', storage)
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
