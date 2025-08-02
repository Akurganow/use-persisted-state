import React from 'react'
import createPersistedState from '@plq/use-persisted-state'
import storage from '@plq/use-persisted-state/storages/session-storage'

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

function SessionStorageExample() {
  return (
    <div>
      <h3>Session Storage Example</h3>
      <Count />
      <Actions />
    </div>
  )
}

export default SessionStorageExample
