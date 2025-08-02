import React, { useState } from 'react'
import LocalStorageExample from './examples/LocalStorageExample'
import SessionStorageExample from './examples/SessionStorageExample'
import AsyncStorageExample from './examples/AsyncStorageExample'

const examples = [
  { id: 'local', name: 'Local Storage', component: LocalStorageExample },
  { id: 'session', name: 'Session Storage', component: SessionStorageExample },
  { id: 'async', name: 'Async Storage', component: AsyncStorageExample },
]

function App() {
  const [activeExample, setActiveExample] = useState('local')

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>usePersistedState Demo</h1>

      <nav style={{ marginBottom: '20px' }}>
        {examples.map(example => (
          <button
            key={example.id}
            onClick={() => setActiveExample(example.id)}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              backgroundColor: activeExample === example.id ? '#007bff' : '#f8f9fa',
              color: activeExample === example.id ? 'white' : 'black',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {example.name}
          </button>
        ))}
      </nav>

      <div style={{ border: '1px solid #dee2e6', padding: '20px', borderRadius: '4px' }}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}

export default App
