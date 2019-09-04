export default function isFunction(value: unknown): value is Function {
  return toString.call(value) === '[object Function]' || typeof value === 'function'
}
