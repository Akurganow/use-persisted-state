/* eslint-disable @typescript-eslint/ban-types */

export default function isObject(value: unknown): value is Object {
  return Object(value) === value
}
