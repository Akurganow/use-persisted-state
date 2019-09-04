import React from 'react'
import { render } from 'react-dom'

import createPersisterState from '../../lib'

const [usePersistedState, clear] = createPersisterState('simple_example', window.sessionStorage)

function App() {
  const [count, setCount] = usePersistedState<number>('count', 0)

  return (
    <div>
      {count}{' '}
      <button
        onClick={() => {
          setCount(prevCount => {
            const newCount = prevCount + 1

            return newCount
          })
        }}>
        +
      </button>
    </div>
  )
}

const root = document.getElementById('root')

render(<App />, root)
