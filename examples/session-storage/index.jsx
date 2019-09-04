import React from 'react'
import { render } from 'react-dom'

import createPersisterState from '../../lib'

const [usePersistedState, clear] = createPersisterState('simple_example', window.sessionStorage)

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
    </div>
  )
}

const root = document.getElementById('root')

render(<App />, root)
