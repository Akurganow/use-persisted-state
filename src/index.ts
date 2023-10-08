import { default as createSyncPersistedState } from './create-persisted-state'
import createAsyncPersistedState from './create-async-persisted-state'

import isAsyncStorage from './utils/is-async-storage'

import { Storage, AsyncStorage } from './@types/storage'
import { PersistedState } from './@types/hook'

export default function createPersistedState<S extends Storage | AsyncStorage>(
  name: string,
  storage: S,
): [PersistedState, () => void | Promise<void>] {
  if (isAsyncStorage(storage)) {
    return createAsyncPersistedState(name, storage as AsyncStorage)
  }

  return createSyncPersistedState(name, storage as Storage)
}

export {
  createSyncPersistedState as createPersistedState,
  createAsyncPersistedState,
}
