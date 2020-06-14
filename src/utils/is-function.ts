export default function isFunction(value: unknown): value is Function {
  return !!value
    && (
      toString.call(value) === '[object Function]'
      || typeof value === 'function'
    )
}
