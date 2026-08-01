import React, { Profiler, memo, useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import createPersistedState from '../src'
import storage from '../src/storages/local-storage'
import type { UsePersistedState } from '../src/@types/hook'

const entryKey = 'persisted_state_hook:component-tree'
const [usePersistedState] = createPersistedState('component-tree', storage)

type CountSetter = UsePersistedState<number>[1]

/**
 * These mount one tree per test on purpose. Two `render` calls produce two React
 * roots that only share `document.body`, so anything they appear to agree on was
 * carried by a storage event rather than by React, and a break in the tree would
 * not show.
 */
describe('a tree holding the hook', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('leaves a memoized child alone when the setter is the prop it receives', () => {
    let childCommits = 0
    const WriteButton = memo(({ onWrite }: { onWrite: CountSetter }) => (
      <Profiler
        id="child"
        onRender={() => {
          childCommits += 1
        }}
      >
        <button type="button" data-testid="writer" onClick={() => onWrite(previous => previous + 1)}>
          write
        </button>
      </Profiler>
    ))
    const Parent = () => {
      const [count, setCount] = usePersistedState('memo', 0)
      const [unrelated, setUnrelated] = useState(0)

      return (
        <>
          <span data-testid="value">{count}</span>
          <button type="button" data-testid="unrelated" onClick={() => setUnrelated(unrelated + 1)}>
            {unrelated}
          </button>
          <WriteButton onWrite={setCount} />
        </>
      )
    }

    render(<Parent />)

    expect(childCommits).toBe(1)

    fireEvent.click(screen.getByTestId('unrelated'))
    fireEvent.click(screen.getByTestId('writer'))

    expect(screen.getByTestId('value')).toHaveTextContent('1')
    expect(screen.getByTestId('unrelated')).toHaveTextContent('1')

    // The setter is the whole of the child's props, so a new identity of it costs
    // a render of a subtree that displays none of the state that changed.
    expect(childCommits).toBe(1)
  })

  test('shows one consumer the value its sibling wrote', () => {
    const Writer = () => {
      const [, setCount] = usePersistedState('shared', 0)

      return (
        <button type="button" data-testid="writer" onClick={() => setCount(previous => previous + 1)}>
          write
        </button>
      )
    }
    const Reader = () => {
      const [count] = usePersistedState('shared', 0)

      return <span data-testid="reader">{count}</span>
    }

    render(
      <>
        <Writer />
        <Reader />
      </>,
    )

    expect(screen.getByTestId('reader')).toHaveTextContent('0')

    fireEvent.click(screen.getByTestId('writer'))

    expect(screen.getByTestId('reader')).toHaveTextContent('1')
  })

  test('does not read the storage again when the tree re-renders around it', () => {
    const getItem = localStorage.getItem as jest.Mock
    const Consumer = () => {
      const [value] = usePersistedState('reads', 'initial')

      return <span data-testid="value">{value}</span>
    }
    const Parent = () => {
      const [tick, setTick] = useState(0)

      return (
        <>
          <button type="button" data-testid="tick" onClick={() => setTick(tick + 1)}>
            {tick}
          </button>
          <Consumer />
        </>
      )
    }

    render(<Parent />)

    const readsAfterMount = getItem.mock.calls.length

    // The counter has to be shown moving at least once, or the assertion at the
    // end is satisfied by a metric that never records anything.
    expect(readsAfterMount).toBeGreaterThan(0)

    fireEvent.click(screen.getByTestId('tick'))
    fireEvent.click(screen.getByTestId('tick'))

    expect(screen.getByTestId('tick')).toHaveTextContent('2')
    expect(getItem.mock.calls.length).toBe(readsAfterMount)
  })

  /**
   * StrictMode is reached through `render`'s own option rather than a
   * `StrictMode` wrapper element. A wrapper double-invokes the render but not the
   * effects, so a subscription test written that way passes whether or not the
   * hook unsubscribes.
   */
  describe('under StrictMode', () => {
    test('re-reads a changed key intact, though the render that does it runs twice', () => {
      localStorage.setItem(entryKey, JSON.stringify({ alpha: 5, beta: 50 }))

      const Consumer = ({ itemKey }: { itemKey: string }) => {
        const [count, setCount] = usePersistedState(itemKey, 0)

        return (
          <button type="button" data-testid="value" onClick={() => setCount(previous => previous + 1)}>
            {count}
          </button>
        )
      }
      const Parent = () => {
        const [itemKey, setItemKey] = useState('alpha')

        return (
          <>
            <button type="button" data-testid="swap" onClick={() => setItemKey('beta')}>
              swap
            </button>
            <Consumer itemKey={itemKey} />
          </>
        )
      }

      render(<Parent />, { reactStrictMode: true })

      expect(screen.getByTestId('value')).toHaveTextContent('5')

      fireEvent.click(screen.getByTestId('value'))

      expect(screen.getByTestId('value')).toHaveTextContent('6')

      // A key change is the one thing this hook settles during render, by writing
      // state and a ref from the render pass itself. StrictMode runs that pass
      // twice and throws one away, so an adjustment that is not idempotent shows
      // the previous key's value here — and the next write saves it over the new
      // key's.
      fireEvent.click(screen.getByTestId('swap'))

      expect(screen.getByTestId('value')).toHaveTextContent('50')

      fireEvent.click(screen.getByTestId('value'))

      expect(screen.getByTestId('value')).toHaveTextContent('51')
      expect(JSON.parse(localStorage.__STORE__[entryKey])).toEqual({ alpha: 6, beta: 51 })
    })

    test('leaves one subscription behind, not the one the discarded mount made', () => {
      const addListener = jest.spyOn(storage.onChanged, 'addListener')
      const Consumer = () => {
        const [value] = usePersistedState('subscription', 'initial')

        return <span data-testid="value">{value}</span>
      }

      const { unmount } = render(<Consumer />, { reactStrictMode: true })
      const registered = addListener.mock.calls.map(([listener]) => listener)
      const stillRegistered = () => registered.filter(listener => storage.onChanged.hasListener(listener))

      // Without the second mount a hook that never unsubscribes leaves exactly one
      // listener too, so the count below would hold for the wrong reason.
      expect(registered).toHaveLength(2)
      expect(stillRegistered()).toHaveLength(1)

      unmount()

      expect(stillRegistered()).toHaveLength(0)
    })
  })
})
