import { isAsyncFunction, isFunction, isPromise } from '@plq/is'
import type { AsyncStorage } from '../@types/storage'

// An unvalidated candidate: its members are unknown until each one is checked.
type StorageCandidate = {
  get?: unknown
  set?: unknown
  remove?: unknown
}

export default function isAsyncStorage(storage: unknown): storage is AsyncStorage {
  const candidate = storage as StorageCandidate | null | undefined

  const hasGet = Boolean(storage) && typeof candidate?.get !== 'undefined'
  const hasSet = Boolean(storage) && typeof candidate?.set !== 'undefined'
  const hasRemove = Boolean(storage) && typeof candidate?.remove !== 'undefined'

  if (!hasGet || !hasSet || !hasRemove) {
    return false
  }

  const { get, set, remove } = candidate as StorageCandidate

  const hasGetPromise = isPromise(get) || (isFunction(get) && isPromise(get(''))) || isAsyncFunction(get)
  const hasSetPromise = isPromise(set) || (isFunction(set) && isPromise(set({}))) || isAsyncFunction(set)
  const hasRemovePromise = isPromise(remove) || (isFunction(remove) && isPromise(remove(''))) || isAsyncFunction(remove)

  return Boolean(storage) && hasGet && hasSet && hasRemove && hasGetPromise && hasSetPromise && hasRemovePromise
}
