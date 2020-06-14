import React, {useEffect, useState} from 'react'

import useStorageHandler from './utils/use-storage-handler'
import getNewValue from './utils/get-new-value'
import getNewItem from './utils/get-new-item'
import getPersistedValue from './utils/get-persisted-value'

import { AsyncStorage } from './@types/storage'
import { UsePersistedState, PersistedState } from './@types/hook'

export default function createAsyncPersistedState(
  storageKey: string,
  storage: AsyncStorage,
): [PersistedState, () => Promise<void>] {
  const safeStorageKey = `persisted_state_hook:${storageKey}`

  const clear = (): Promise<void> => {
    return storage.remove(safeStorageKey)
  }

  const usePersistedState = <T>(key: string, initialValue: T | (() => T)): UsePersistedState<T> => {
    const [state, setState] = useState<T>(initialValue)

    const setPersistedState = async (newState: React.SetStateAction<T>): Promise<void> => {
      const newValue = getNewValue<T>(newState, state)

      const persistedItem = await storage.get(safeStorageKey)
      const newItem = getNewItem<T>(key, persistedItem[safeStorageKey], newValue)

      await storage.set({ [safeStorageKey]: newItem })
    }

    useEffect(() => {
      const setInitialValue = async () => {
        const persist = await storage.get(safeStorageKey)
        const initialOrPersistedValue = getPersistedValue<T>(key, initialValue, persist[safeStorageKey])

        setState(initialOrPersistedValue)
      }

      setInitialValue()
    }, [initialValue, key])

    useStorageHandler<T>(key, safeStorageKey, setState, storage, initialValue)

    return [state, setPersistedState]
  }

  return [usePersistedState, clear]
}
