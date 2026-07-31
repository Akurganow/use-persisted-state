import { isAsyncFunction, isFunction, isPromise } from '@plq/is'
import type { AsyncStorage } from '../@types/storage'

// An unvalidated candidate: its members are unknown until each one is checked.
type StorageCandidate = {
  get?: unknown
  set?: unknown
  remove?: unknown
}

// Asyncness that can be established without invoking the member.
const isProvablyAsync = (member: unknown): boolean => isPromise(member) || isAsyncFunction(member)

// `@plq/is` classifies async functions as their own type, so `isFunction` rejects them:
// every callable check here has to admit both or async storages fall out on the sync path.
const isUsableMember = (member: unknown): boolean => isFunction(member) || isProvablyAsync(member)

/**
 * Narrows a storage to {@link AsyncStorage}, deciding which hook the entry point builds.
 *
 * Inspection never writes: `set` and `remove` are only checked for shape, never invoked, so
 * `get` alone decides. A candidate pairing an async `get` with a sync `set` satisfies neither
 * storage interface, which is why proving the other two members is not worth a write.
 */
export default function isAsyncStorage(storage: unknown): storage is AsyncStorage {
  const candidate = storage as StorageCandidate | null | undefined

  if (!candidate) {
    return false
  }

  const { get, set, remove } = candidate

  if (!isUsableMember(set) || !isUsableMember(remove)) {
    return false
  }

  if (isProvablyAsync(get)) {
    return true
  }

  if (!isFunction(get)) {
    return false
  }

  // `AsyncStorage` admits a plain function returning a promise, and nothing short of a call tells
  // that apart from a sync get. Any adapter written that way can only be recognised here, and a
  // third-party one is free to be written that way, so this line stays necessary however the
  // shipped adapters happen to declare themselves. A read is the one probe that leaves the
  // inspected storage as it found it.
  const probe = get('')

  if (!isPromise(probe)) {
    return false
  }

  // Only the probe's shape answers the question, so its outcome is discarded by construction.
  // The rejection still has to be claimed: unclaimed, it terminates the process on Node 15+,
  // letting a storage that merely fails a read take the consuming application down with it.
  probe.then(undefined, () => undefined)

  return true
}
