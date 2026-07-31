import createSyncPersistedState from './create-persisted-state'
import createAsyncPersistedState from './create-async-persisted-state'

import isAsyncStorage from './utils/is-async-storage'

import type { Storage, AsyncStorage } from './@types/storage'
import type { PersistedState } from './@types/hook'

export default function createPersistedState<S extends Storage | AsyncStorage>(
  name: string,
  storage: S,
): [PersistedState, () => void | Promise<void>] {
  if (isAsyncStorage(storage)) {
    return createAsyncPersistedState(name, storage as AsyncStorage)
  }

  return createSyncPersistedState(name, storage as Storage)
}

export { default as createPersistedState } from './create-persisted-state'
export { default as createAsyncPersistedState } from './create-async-persisted-state'

// The contract a backend implements, and the shape the hook hands back. Both appear in the
// signatures above, so a consumer writing an adapter or typing a wrapper has to be able to name
// them from the supported entry point rather than from `lib/`, which the exports map keeps open
// only as a frozen legacy path.
export type { AsyncStorage, Storage, StorageChange, StorageChangeEvent, StorageChangeListener } from './@types/storage'
export type { PersistedState, UsePersistedState } from './@types/hook'
