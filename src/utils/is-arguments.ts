/* eslint-disable @typescript-eslint/no-non-null-assertion */

export default function isArguments(value: unknown): boolean {
  return (
    toString.call(value) === '[object Arguments]' || (value !== null && typeof value === 'object' && 'callee' in value!)
  )
}
