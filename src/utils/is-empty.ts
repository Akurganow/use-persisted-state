import isObject from './is-object'
import isArray from './is-array'
import isArguments from './is-arguments'

export default function isEmpty(value: unknown): boolean {
  if (isObject(value)) {
    const length = Object.getOwnPropertyNames(value).length
    if (length === 0 || (length === 1 && isArray(value)) || (length === 2 && isArguments(value))) {
      return true
    }
    return false
  }
  return value === ''
}
