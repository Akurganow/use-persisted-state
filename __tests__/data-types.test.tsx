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

      // null не сохраняется, остается initial value
      expect(result.current[0]).toBe('initial')
    })
  })

  describe('Undefined values', () => {
    test('should handle undefined values correctly', () => {
      const { result } = renderHook(() => usePersistedState<string | undefined>('undefinedKey', 'initial'))

      act(() => {
        result.current[1](undefined)
      })

      // undefined не сериализуется в JSON, поэтому остается initial value
      expect(result.current[0]).toBe('initial')
    })

    test('should handle undefined initial value', () => {
      const { result } = renderHook(() => usePersistedState<undefined>('undefinedInitialKey', undefined))

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

      // NaN не сериализуется корректно в JSON, остается initial value
      expect(result.current[0]).toBe(0)
    })

    test('should handle Infinity values', () => {
      const { result } = renderHook(() => usePersistedState('infinityKey', 0))

      act(() => {
        result.current[1](Infinity)
      })

      // Infinity не сериализуется корректно в JSON, остается initial value
      expect(result.current[0]).toBe(0)
    })

    test('should handle -Infinity values', () => {
      const { result } = renderHook(() => usePersistedState('negInfinityKey', 0))

      act(() => {
        result.current[1](-Infinity)
      })

      // -Infinity не сериализуется корректно в JSON, остается initial value
      expect(result.current[0]).toBe(0)
    })
  })

  describe('State persistence across hook instances', () => {
    test('should maintain state between different hook instances', () => {
      // Первый экземпляр хука
      const { result: result1 } = renderHook(() => usePersistedState<any>('persistenceKey', 'initial'))

      act(() => {
        result1.current[1]({ test: 'value', number: 123 })
      })

      // Второй экземпляр хука с тем же ключом
      const { result: result2 } = renderHook(() => usePersistedState<any>('persistenceKey', 'initial'))

      expect(result2.current[0]).toEqual({ test: 'value', number: 123 })
    })

    test('should handle type changes in persisted state', () => {
      // Сначала сохраняем строку
      const { result: result1 } = renderHook(() => usePersistedState<any>('typeChangeKey', 'initial'))

      act(() => {
        result1.current[1]('string value')
      })

      expect(result1.current[0]).toBe('string value')

      // Затем меняем на число
      act(() => {
        result1.current[1](42)
      })

      expect(result1.current[0]).toBe(42)

      // Затем меняем на объект
      act(() => {
        result1.current[1]({ changed: true })
      })

      expect(result1.current[0]).toEqual({ changed: true })
    })
  })
})
