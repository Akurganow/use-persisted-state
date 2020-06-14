import isPromise from './is-promise'
import isFunction from './is-function'

import { AsyncStorage } from '../@types/storage'

export default function isAsyncStorage(storage: unknown): storage is AsyncStorage {
  return !!storage
  && typeof (storage as any).get !== 'undefined'
  && (
    isPromise((storage as any).get)
    || (
      isFunction((storage as any).get)
      && isPromise((storage as any).get(''))
    )
  )
}
