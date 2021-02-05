export default function isFunction(value: unknown): value is Function {
  return !!value
    && (
      Object.prototype.toString.call(value) === '[object Function]'
      || typeof value === 'function'
    )
}
