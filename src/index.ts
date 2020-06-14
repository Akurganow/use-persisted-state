import { default as createSyncPersistedState } from './create-persisted-state'
import createAsyncPersistedState from './create-async-persisted-state'

import isAsyncStorage from './utils/is-async-storage'

import { Storage, AsyncStorage } from './@types/storage'
import { PersistedState } from './@types/hook'

export default function createPersistedState(
  name: string,
  storage: Storage | AsyncStorage,
): [PersistedState, () => void | Promise<void>] {
  if (isAsyncStorage(storage)) {
    return createAsyncPersistedState(name, storage)
  }

  return createSyncPersistedState(name, storage)
}

export {
  createSyncPersistedState as createPersistedState,
  createAsyncPersistedState,
}
