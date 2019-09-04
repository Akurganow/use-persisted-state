import React from 'react'
import { render } from 'react-dom'

import createPersistedState from '../../lib'

const [usePersistedState, clear] = createPersistedState('simple_example')

function App() {
  const [count, setCount] = usePersistedState('count', 0)

  return (
    <div>
      {count}{' '}
      <button
        onClick={() => {
          setCount(prevCount => prevCount + 1)
        }}>
        +
      </button>
      <button onClick={() => { clear() }}>Clear</button>
    </div>
  )
}

const root = document.getElementById('root')

render(<App />, root)
