import { isAsyncFunction, isFunction, isPromise } from '@plq/is'
import type { AsyncStorage } from '../@types/storage'

type StorageCandidate = {
  get?: unknown
  set?: unknown
  remove?: unknown
}

// `@plq/is` classifies async functions as their own type, so `isFunction` alone rejects them.
const isCallableMember = (member: unknown): boolean => isFunction(member) || isAsyncFunction(member)

/** Narrows a storage to {@link AsyncStorage}. Inspecting never writes: `set` and `remove` are never called. */
export default function isAsyncStorage(storage: unknown): storage is AsyncStorage {
  const candidate = storage as StorageCandidate | null | undefined

  if (!candidate) {
    return false
  }

  const { get, set, remove } = candidate

  if (!isCallableMember(set) || !isCallableMember(remove)) {
    return false
  }

  // An `async` declaration is the one form of asyncness visible without a call.
  if (isAsyncFunction(get)) {
    return true
  }

  if (!isFunction(get)) {
    return false
  }

  // A plain function returning a promise is a valid `AsyncStorage`, and only a call tells it from a sync get.
  let probe: unknown

  try {
    // Called as a method: an adapter reading its own state through `this` would throw on a torn-off function.
    probe = get.call(candidate, '')
  } catch {
    // Deferred, not swallowed: factories are built at module scope, where a throw takes the import down.
    return false
  }

  if (!isPromise(probe)) {
    return false
  }

  // An unclaimed rejection terminates the process on Node 15+, so the discarded probe still has to be claimed.
  probe.then(undefined, () => undefined)

  return true
}
