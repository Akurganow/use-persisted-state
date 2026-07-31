import createPersistedState from '../src'
import { renderHook, cleanup, act } from '@testing-library/react'
import storage from '../src/storages/local-storage'

const [usePersistedState, clear] = createPersistedState('dataTypes', storage)

describe('Data Types Persistence', () => {
  beforeEach(() => {
    cleanup()
    clear()
    localStorage.clear()
  })

  describe('Number values', () => {
    test('should persist positive integer values', () => {
      const { result } = renderHook(() => usePersistedState('numberKey', 0))

      act(() => {
        result.current[1](42)
      })

      expect(result.current[0]).toBe(42)
    })

    test('should persist negative integer values', () => {
      const { result } = renderHook(() => usePersistedState('negativeKey', 0))

      act(() => {
        result.current[1](-50)
      })

      expect(result.current[0]).toBe(-50)
    })

    test('should persist decimal values', () => {
      const { result } = renderHook(() => usePersistedState('decimalKey', 0))

      act(() => {
        result.current[1](3.14159)
      })

      expect(result.current[0]).toBe(3.14159)
    })

    test('should persist zero value', () => {
      const { result } = renderHook(() => usePersistedState('zeroKey', 1))

      act(() => {
        result.current[1](0)
      })

      expect(result.current[0]).toBe(0)
    })
  })

  describe('Boolean values', () => {
    test('should persist true value', () => {
      const { result } = renderHook(() => usePersistedState('boolTrueKey', false))

      act(() => {
        result.current[1](true)
      })

      expect(result.current[0]).toBe(true)
    })

    test('should persist false value', () => {
      const { result } = renderHook(() => usePersistedState('boolFalseKey', true))

      act(() => {
        result.current[1](false)
      })

      expect(result.current[0]).toBe(false)
    })
  })

  describe('Array values', () => {
    test('should persist empty array', () => {
      const initialArray: any[] = []
      const { result } = renderHook(() => usePersistedState<any[]>('emptyArrayKey', initialArray))

      act(() => {
        result.current[1]([])
      })

      expect(result.current[0]).toEqual([])
    })

    test('should persist array with mixed types', () => {
      const initialArray: any[] = []
      const { result } = renderHook(() => usePersistedState<any[]>('mixedArrayKey', initialArray))
      const testArray = [1, 'string', true, { nested: 'object' }, null]

      act(() => {
        result.current[1](testArray)
      })

      expect(result.current[0]).toEqual(testArray)
    })

    test('should persist array of numbers', () => {
      const initialArray: number[] = []
      const { result } = renderHook(() => usePersistedState<number[]>('numberArrayKey', initialArray))
      const numberArray = [1, 2, 3, 4, 5]

      act(() => {
        result.current[1](numberArray)
      })

      expect(result.current[0]).toEqual(numberArray)
    })

    test('should persist array of strings', () => {
      const initialArray: string[] = []
      const { result } = renderHook(() => usePersistedState<string[]>('stringArrayKey', initialArray))
      const stringArray = ['hello', 'world', 'test']

      act(() => {
        result.current[1](stringArray)
      })

      expect(result.current[0]).toEqual(stringArray)
    })
  })

  describe('Null values', () => {
    test('should handle null value', () => {
      const { result } = renderHook(() => usePersistedState<string | null>('nullKey', 'initial'))

      act(() => {
        result.current[1](null)
      })

      // null is a value the user set, not an absence: it must not be
      // replaced by the initial value on read-back.
      expect(result.current[0]).toBeNull()
    })

    test('should read back null set via the setter', () => {
      const { result } = renderHook(() => usePersistedState<string | null>('nullRoundTripKey', 'initial'))

      act(() => {
        result.current[1](null)
      })

      // The full round trip: the setter writes null into storage and the
      // read path must return it instead of falling back to the initial value.
      expect(localStorage.__STORE__['persisted_state_hook:dataTypes']).toBe(JSON.stringify({ nullRoundTripKey: null }))
      expect(result.current[0]).toBeNull()
    })

    test('should read back null from a freshly mounted hook', () => {
      const { result: writer } = renderHook(() => usePersistedState<string | null>('nullRemountKey', 'initial'))

      act(() => {
        writer.current[1](null)
      })

      const { result: reader } = renderHook(() => usePersistedState<string | null>('nullRemountKey', 'initial'))

      // The half of the round trip a page reload exercises. Staying green in the same hook
      // instance proves only that the value survived in memory; a hook that never saw the
      // write has to reach the same null, or the initial value silently resurrects.
      expect(reader.current[0]).toBeNull()
    })
  })

  describe('Undefined values', () => {
    test('should handle undefined values correctly', () => {
      const { result } = renderHook(() => usePersistedState<string | undefined>('undefinedKey', 'initial'))

      act(() => {
        result.current[1](undefined)
      })

      // useState parity: JSON cannot persist undefined, but the in-memory
      // value the setter was given must stay undefined instead of snapping
      // back to the initial value.
      expect(result.current[0]).toBeUndefined()
    })

    test('should handle undefined initial value', () => {
      const { result } = renderHook(() => usePersistedState<undefined>('undefinedInitialKey', undefined))

      expect(result.current[0]).toBeUndefined()
    })

    test('should keep undefined set via the setter', () => {
      const { result } = renderHook(() => usePersistedState<string | undefined>('undefinedRoundTripKey', 'initial'))

      act(() => {
        result.current[1](undefined)
      })

      // useState parity: even though JSON cannot persist undefined, the
      // in-memory state the setter was given must not be silently replaced.
      expect(result.current[0]).toBeUndefined()
    })
  })

  describe('Complex Object values', () => {
    test('should persist simple object', () => {
      const initialObject = {}
      const { result } = renderHook(() => usePersistedState<any>('simpleObjectKey', initialObject))
      const simpleObject = { key: 'value', number: 42 }

      act(() => {
        result.current[1](simpleObject)
      })

      expect(result.current[0]).toEqual(simpleObject)
    })

    test('should persist complex nested object', () => {
      const initialObject = {}
      const { result } = renderHook(() => usePersistedState<any>('complexObjectKey', initialObject))
      const complexObject = {
        string: 'value',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: {
          deep: {
            value: 'nested',
            array: ['a', 'b', 'c'],
          },
        },
        nullValue: null,
      }

      act(() => {
        result.current[1](complexObject)
      })

      expect(result.current[0]).toEqual(complexObject)
    })

    test('should persist object with array properties', () => {
      const initialObject = {}
      const { result } = renderHook(() => usePersistedState<any>('objectWithArrayKey', initialObject))
      const objectWithArray = {
        numbers: [1, 2, 3],
        strings: ['a', 'b', 'c'],
        mixed: [1, 'two', true, null],
      }

      act(() => {
        result.current[1](objectWithArray)
      })

      expect(result.current[0]).toEqual(objectWithArray)
    })
  })

  describe('Edge Cases', () => {
    test('should handle NaN values', () => {
      const { result } = renderHook(() => usePersistedState('nanKey', 0))

      act(() => {
        result.current[1](NaN)
      })

      // Parity with useState within the session: the value handed to the setter is the value the
      // component keeps. It does not outlive a reload — JSON has no NaN, `JSON.stringify` writes
      // null, and nothing here promises otherwise; the case below pins what a later reader sees
      // instead. The accepted cost is that until something remounts, another component on this
      // key reads the stored null while this one still holds NaN — deliberate, not an oversight,
      // and the alternative was a second copy of the re-sync the hook deleted. The Infinity cases
      // follow the same rule.
      expect(result.current[0]).toBeNaN()
    })

    test('should handle Infinity values', () => {
      const { result } = renderHook(() => usePersistedState('infinityKey', 0))

      act(() => {
        result.current[1](Infinity)
      })

      expect(result.current[0]).toBe(Infinity)
    })

    test('should handle -Infinity values', () => {
      const { result } = renderHook(() => usePersistedState('negInfinityKey', 0))

      act(() => {
        result.current[1](-Infinity)
      })

      expect(result.current[0]).toBe(-Infinity)
    })

    test('should read back a NaN written by an earlier instance as null', () => {
      const { result: writer } = renderHook(() => usePersistedState<number | null>('nanAcrossInstancesKey', 0))

      act(() => {
        writer.current[1](NaN)
      })

      const { result: reader } = renderHook(() => usePersistedState<number | null>('nanAcrossInstancesKey', 0))

      // The other side of the same limit: null is what JSON left in storage, so null is
      // what a later reader must see. Falling back to the initial value here would hide
      // the write and resurrect a value the user replaced.
      expect(reader.current[0]).toBeNull()
    })
  })

  describe('State persistence across hook instances', () => {
    test('should maintain state between different hook instances', () => {
      const { result: result1 } = renderHook(() => usePersistedState<any>('persistenceKey', 'initial'))

      act(() => {
        result1.current[1]({ test: 'value', number: 123 })
      })

      const { result: result2 } = renderHook(() => usePersistedState<any>('persistenceKey', 'initial'))

      expect(result2.current[0]).toEqual({ test: 'value', number: 123 })
    })

    test('should handle type changes in persisted state', () => {
      const { result: result1 } = renderHook(() => usePersistedState<any>('typeChangeKey', 'initial'))

      act(() => {
        result1.current[1]('string value')
      })

      expect(result1.current[0]).toBe('string value')

      act(() => {
        result1.current[1](42)
      })

      expect(result1.current[0]).toBe(42)

      act(() => {
        result1.current[1]({ changed: true })
      })

      expect(result1.current[0]).toEqual({ changed: true })
    })
  })
})
