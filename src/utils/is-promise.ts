export default function isPromise<T = unknown>(value: unknown): value is PromiseLike<T> {
  return !!value
    && (
      toString.call(value) === '[object Promise]'
      || typeof value === 'function'
    )
    && typeof (value as PromiseLike<unknown>).then === 'function'
}
