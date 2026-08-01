import createPersistedState from '../src'
import { renderHook, cleanup, act } from '@testing-library/react'
import storage from '../src/storages/local-storage'

const entryKey = 'persisted_state_hook:dataTypes'
const [usePersistedState, clear] = createPersistedState('dataTypes', storage)

function readStoredEntry(): unknown {
  const entry = localStorage.__STORE__[entryKey]

  return entry === undefined ? undefined : JSON.parse(entry)
}

type PersistOutcome<T> = {
  held: T
  entry: unknown
  readBack: T
}

/**
 * Writes `value` through the hook and reports the three things persisting it
 * produced: the value the writer holds, the entry that reached storage, and the
 * value a hook that never saw the write reads back.
 *
 * Every case below asserts all three, because each catches a different failure
 * and the held value catches none of them: a hook that writes nothing at all
 * satisfies it, which is what left every `should persist` case here green with
 * the write deleted from the setter. The entry shows what the type encodes to,
 * and the read-back shows a fresh mount decoding it back rather than falling
 * through to its initial value.
 */
function persistThroughStorage<T>(key: string, initialValue: T, value: T): PersistOutcome<T> {
  const { result: writer } = renderHook(() => usePersistedState<T>(key, initialValue))

  act(() => {
    writer.current[1](value)
  })

  const held = writer.current[0]
  const entry = readStoredEntry()
  const { result: reader } = renderHook(() => usePersistedState<T>(key, initialValue))

  return { held, entry, readBack: reader.current[0] }
}

describe('Data Types Persistence', () => {
  beforeEach(() => {
    cleanup()
    clear()
    localStorage.clear()
  })

  describe('Number values', () => {
    test('should persist positive integer values', () => {
      const persisted = persistThroughStorage('numberKey', 0, 42)

      expect(persisted.held).toBe(42)
      expect(persisted.entry).toEqual({ numberKey: 42 })
      expect(persisted.readBack).toBe(42)
    })

    test('should persist negative integer values', () => {
      const persisted = persistThroughStorage('negativeKey', 0, -50)

      expect(persisted.held).toBe(-50)
      expect(persisted.entry).toEqual({ negativeKey: -50 })
      expect(persisted.readBack).toBe(-50)
    })

    test('should persist decimal values', () => {
      const persisted = persistThroughStorage('decimalKey', 0, 3.14159)

      expect(persisted.held).toBe(3.14159)
      expect(persisted.entry).toEqual({ decimalKey: 3.14159 })
      expect(persisted.readBack).toBe(3.14159)
    })

    test('should persist zero value', () => {
      const persisted = persistThroughStorage('zeroKey', 1, 0)

      expect(persisted.held).toBe(0)
      expect(persisted.entry).toEqual({ zeroKey: 0 })
      expect(persisted.readBack).toBe(0)
    })
  })

  describe('Boolean values', () => {
    test('should persist true value', () => {
      const persisted = persistThroughStorage('boolTrueKey', false, true)

      expect(persisted.held).toBe(true)
      expect(persisted.entry).toEqual({ boolTrueKey: true })
      expect(persisted.readBack).toBe(true)
    })

    test('should persist false value', () => {
      const persisted = persistThroughStorage('boolFalseKey', true, false)

      expect(persisted.held).toBe(false)
      expect(persisted.entry).toEqual({ boolFalseKey: false })
      expect(persisted.readBack).toBe(false)
    })
  })

  describe('Array values', () => {
    test('should persist empty array', () => {
      const persisted = persistThroughStorage<unknown[]>('emptyArrayKey', [], [])

      expect(persisted.held).toEqual([])
      // The one case where the read-back cannot tell persistence from a hook that
      // stored nothing: an empty array is also the initial value, so the entry is
      // the whole of the evidence.
      expect(persisted.entry).toEqual({ emptyArrayKey: [] })
      expect(persisted.readBack).toEqual([])
    })

    test('should persist array with mixed types', () => {
      const mixedArray = [1, 'string', true, { nested: 'object' }, null]
      const persisted = persistThroughStorage<unknown[]>('mixedArrayKey', [], mixedArray)

      expect(persisted.held).toEqual(mixedArray)
      expect(persisted.entry).toEqual({ mixedArrayKey: mixedArray })
      expect(persisted.readBack).toEqual(mixedArray)
    })

    test('should persist array of numbers', () => {
      const numberArray = [1, 2, 3, 4, 5]
      const persisted = persistThroughStorage<number[]>('numberArrayKey', [], numberArray)

      expect(persisted.held).toEqual(numberArray)
      expect(persisted.entry).toEqual({ numberArrayKey: numberArray })
      expect(persisted.readBack).toEqual(numberArray)
    })

    test('should persist array of strings', () => {
      const stringArray = ['hello', 'world', 'test']
      const persisted = persistThroughStorage<string[]>('stringArrayKey', [], stringArray)

      expect(persisted.held).toEqual(stringArray)
      expect(persisted.entry).toEqual({ stringArrayKey: stringArray })
      expect(persisted.readBack).toEqual(stringArray)
    })
  })

  describe('Null values', () => {
    test('should handle null value', () => {
      const { result } = renderHook(() => usePersistedState<string | null>('nullKey', 'initial'))

      act(() => {
        result.current[1](null)
      })

      // The in-memory half only: null is a value the caller set, not an absence,
      // so the hook must not swap it for the initial value. What the write leaves
      // in storage and what a later reader sees are the two cases below.
      expect(result.current[0]).toBeNull()
    })

    test('should read back null set via the setter', () => {
      const { result } = renderHook(() => usePersistedState<string | null>('nullRoundTripKey', 'initial'))

      act(() => {
        result.current[1](null)
      })

      // The full round trip: the setter writes null into storage and the
      // read path must return it instead of falling back to the initial value.
      expect(localStorage.__STORE__[entryKey]).toBe(JSON.stringify({ nullRoundTripKey: null }))
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

    test('should apply a null written by another hook on the same key', () => {
      const { result: writer } = renderHook(() => usePersistedState<string | null>('nullSyncKey', 'initial'))
      const { result: reader } = renderHook(() => usePersistedState<string | null>('nullSyncKey', 'initial'))

      act(() => {
        writer.current[1](null)
      })

      // Two components sharing a key must not disagree. The change event carries the stored
      // null and the listener has to apply it; reading "stored null" as "no value" strands
      // this reader on its initial value while the writer already shows null.
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

    test('should write an entry without the key and still hold undefined', () => {
      const { result } = renderHook(() => usePersistedState<string | undefined>('undefinedRoundTripKey', 'initial'))

      act(() => {
        result.current[1](undefined)
      })

      // What the write leaves behind, which is what separates this from the case
      // above: JSON drops an undefined member, so the entry is written without
      // the key and a later mount finds nothing to restore.
      expect(localStorage.__STORE__[entryKey]).toBe(JSON.stringify({}))
      expect(result.current[0]).toBeUndefined()
    })
  })

  describe('Complex Object values', () => {
    test('should persist simple object', () => {
      const simpleObject = { key: 'value', number: 42 }
      const persisted = persistThroughStorage<Record<string, unknown>>('simpleObjectKey', {}, simpleObject)

      expect(persisted.held).toEqual(simpleObject)
      expect(persisted.entry).toEqual({ simpleObjectKey: simpleObject })
      expect(persisted.readBack).toEqual(simpleObject)
    })

    test('should persist complex nested object', () => {
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
      const persisted = persistThroughStorage<Record<string, unknown>>('complexObjectKey', {}, complexObject)

      expect(persisted.held).toEqual(complexObject)
      expect(persisted.entry).toEqual({ complexObjectKey: complexObject })
      expect(persisted.readBack).toEqual(complexObject)
    })

    test('should persist object with array properties', () => {
      const objectWithArray = {
        numbers: [1, 2, 3],
        strings: ['a', 'b', 'c'],
        mixed: [1, 'two', true, null],
      }
      const persisted = persistThroughStorage<Record<string, unknown>>('objectWithArrayKey', {}, objectWithArray)

      expect(persisted.held).toEqual(objectWithArray)
      expect(persisted.entry).toEqual({ objectWithArrayKey: objectWithArray })
      expect(persisted.readBack).toEqual(objectWithArray)
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
      const value = { test: 'value', number: 123 }
      const persisted = persistThroughStorage<Record<string, unknown>>('persistenceKey', {}, value)

      expect(persisted.entry).toEqual({ persistenceKey: value })
      expect(persisted.readBack).toEqual(value)
    })

    test('should handle type changes in persisted state', () => {
      const { result } = renderHook(() => usePersistedState<unknown>('typeChangeKey', 'initial'))

      act(() => {
        result.current[1]('string value')
      })

      expect(result.current[0]).toBe('string value')
      expect(readStoredEntry()).toEqual({ typeChangeKey: 'string value' })

      act(() => {
        result.current[1](42)
      })

      expect(result.current[0]).toBe(42)
      expect(readStoredEntry()).toEqual({ typeChangeKey: 42 })

      act(() => {
        result.current[1]({ changed: true })
      })

      expect(result.current[0]).toEqual({ changed: true })
      // A replaced value has to leave nothing of the previous type behind, or a
      // later reader decodes a value of a type the caller has already moved off.
      expect(readStoredEntry()).toEqual({ typeChangeKey: { changed: true } })
    })
  })
})
