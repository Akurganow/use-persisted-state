import React from 'react'
import createPersistedState from '../src'
import { render, fireEvent, cleanup, act, waitFor } from '@testing-library/react'

const [usePersistedState, clear] = createPersistedState('test')

describe('Integration Tests', () => {
  afterEach(() => {
    cleanup()
    clear()
    localStorage.clear()
  })

  it('Component should rerender from change to local storage', async () => {
    const initialValue = 0
    const testComponentId = 'test_count_component'
    const testButtonId = 'test_count_button'

    const Counter = () => {
      const [count] = usePersistedState('count', initialValue)

      return <span data-testid={testComponentId}>{count}</span>
    }
    const Button = () => {
      const [, setCount] = usePersistedState('count', initialValue)

      return (
        <button
          onClick={() => setCount(prev => prev + 1)}
          data-testid={testButtonId}
        >
          Test Button
        </button>
      )
    }

    const testButton = render(<Button />)
    const testComponent = render(<Counter />)

    expect(testComponent.getByTestId(testComponentId).textContent).toBe(String(initialValue))

    act(() => {
      fireEvent.click(testButton.getByTestId(testButtonId))
    })

    expect(testComponent.getByTestId(testComponentId).textContent).toBe(String(initialValue + 1))
  })

  it('Component should render with persisted state', async () => {
    const initialValue = 0
    const testComponentId = 'test_count_component'
    const testButtonId = 'test_count_button'

    const Component = () => {
      const [count] = usePersistedState('count', initialValue)

      return <span data-testid={testComponentId}>{count}</span>
    }
    const TestButton = () => {
      const [, setCount] = usePersistedState('count', initialValue)

      return (
        <button
          onClick={() => {
            setCount(prev => prev + 1)
          }}
          data-testid={testButtonId}
        >
          Test Button
        </button>
      )
    }

    const testButton = render(<TestButton />)

    await act(async () => { await waitFor(() => fireEvent.click(testButton.getByTestId(testButtonId))) })

    const testComponent = render(<Component />)

    expect(testComponent.getByTestId(testComponentId).textContent).toBe(String(initialValue + 1))
  })

  it('Should clear persisted state', async () => {
    const initialValue = 0
    const testComponentId = 'test_count_component'
    const testButtonId = 'test_count_button'
    const clearButtonId = 'test_clear_button'

    const Component = () => {
      const [count] = usePersistedState('count', initialValue)

      return <span data-testid={testComponentId}>{count}</span>
    }
    const TestButton = () => {
      const [, setCount] = usePersistedState('count', initialValue)

      return (
        <button
          onClick={() => {
            setCount(prev => prev + 1)
          }}
          data-testid={testButtonId}
        >
          Test Button
        </button>
      )
    }
    const ClearButton = () => {
      return (
        <button
          onClick={() => {
            clear()
          }}
          data-testid={clearButtonId}
        >
          Clear Button
        </button>
      )
    }

    const testButton = render(<TestButton />)
    const clearButton = render(<ClearButton />)

    await act(async () => {
      await waitFor(() => fireEvent.click(testButton.getByTestId(testButtonId)))
      await waitFor(() => fireEvent.click(clearButton.getByTestId(clearButtonId)))
    })

    const testComponent = render(<Component />)

    expect(testComponent.getByTestId(testComponentId).textContent).toBe(String(initialValue))
  })

  it('Should change state when set initial value', async () => {
    const initialValue = 0
    const testComponentId = 'test_count_component'
    const testButtonId = 'test_count_button'
    const testInitialButtonId = 'test_count_initial_button'

    const Counter = () => {
      const [count] = usePersistedState('count', initialValue)

      return <span data-testid={testComponentId}>{count}</span>
    }
    const Button = () => {
      const [, setCount] = usePersistedState('count', initialValue)

      return (
        <button
          onClick={() => { setCount(initialValue + 1) }}
          data-testid={testButtonId}
        >
          Test Button
        </button>
      )
    }
    const InitialButton = () => {
      const [, setCount] = usePersistedState('count', initialValue)

      return (
        <button
          onClick={() => { setCount(initialValue) }}
          data-testid={testInitialButtonId}
        >
          Test Button
        </button>
      )
    }

    const testButton = render(<Button />)
    const testInitialButton = render(<InitialButton />)
    const testComponent = render(<Counter />)

    expect(testComponent.getByTestId(testComponentId).textContent).toBe(String(initialValue))

    act(() => {
      fireEvent.click(testButton.getByTestId(testButtonId))
    })

    expect(testComponent.getByTestId(testComponentId).textContent).toBe(String(initialValue + 1))

    act(() => {
      fireEvent.click(testInitialButton.getByTestId(testInitialButtonId))
    })

    console.log(localStorage.__STORE__);

    expect(testComponent.getByTestId(testComponentId).textContent).toBe(String(initialValue))
  })
})
