import {isFunction, isAsyncFunction, isPromise} from '@plq/is'
import type {AsyncStorage} from '../@types/storage'

export default function isAsyncStorage(storage: unknown): storage is AsyncStorage {
    const hasGet = Boolean(storage) && typeof (storage as any)?.get !== 'undefined'
    const hasSet = Boolean(storage) && typeof (storage as any)?.set !== 'undefined'
    const hasRemove = Boolean(storage) && typeof (storage as any)?.remove !== 'undefined'

    if (!hasGet || !hasSet || !hasRemove) {
        return false
    }

    const hasGetPromise = isPromise((storage as any).get)
        || isFunction((storage as any).get) && isPromise((storage as any).get(''))
        || isAsyncFunction((storage as any).get)
    const hasSetPromise = isPromise((storage as any).set)
        || isFunction((storage as any).set) && isPromise((storage as any).set({}))
        || isAsyncFunction((storage as any).set)
    const hasRemovePromise = isPromise((storage as any).remove)
        || isFunction((storage as any).remove) && isPromise((storage as any).remove(''))
        || isAsyncFunction((storage as any).remove)

    return Boolean(storage)
        && hasGet
        && hasSet
        && hasRemove
        && hasGetPromise
        && hasSetPromise
        && hasRemovePromise
}
