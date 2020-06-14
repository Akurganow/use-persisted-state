import React, { useState } from 'react'

import { Storage } from './@types/storage'
import { UsePersistedState, PersistedState } from './@types/hook'

import useStorageHandler from './utils/use-storage-handler'
import getNewValue from './utils/get-new-value'
import getNewItem from './utils/get-new-item'
import getPersistedValue from './utils/get-persisted-value'

export default function createPersistedState(
  storageKey: string,
  storage: Storage,
): [PersistedState, () => void] {
  const safeStorageKey = `persisted_state_hook:${storageKey}`
  const clear = (): void => {
    storage.remove(safeStorageKey)
  }

  const usePersistedState = <T>(key: string, initialValue: T): UsePersistedState<T> => {
    const persist = storage.get(safeStorageKey)
    const initialOrPersistedValue = getPersistedValue<T>(key, initialValue, persist[safeStorageKey])

    const [state, setState] = useState<T>(initialOrPersistedValue)

    const setPersistedState = (newState: React.SetStateAction<T>): void => {
      const newValue = getNewValue<T>(newState, state)

      setState(newValue)

      const persistedItem = storage.get(safeStorageKey)[safeStorageKey]
      const newItem = getNewItem<T>(key, persistedItem, newValue)

      storage.set({[safeStorageKey]: newItem})
    }

    useStorageHandler<T>(key, safeStorageKey, setState, storage, initialValue)

    return [state, setPersistedState]
  }

  return [usePersistedState, clear]
}
