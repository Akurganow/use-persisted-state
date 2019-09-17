/* eslint-disable @typescript-eslint/no-explicit-any */

export default function isArray(value: unknown): value is any[] {
  return Array.isArray(value) || toString.call(value) === '[object Array]'
}
