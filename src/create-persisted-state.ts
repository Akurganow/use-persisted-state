import type React from 'react'
import { useCallback, useRef, useState } from 'react'

import type { Storage } from './@types/storage'
import type { PersistedState, UsePersistedState } from './@types/hook'

import useStorageHandler, { recordOwnWrite } from './utils/use-storage-handler'
import getNewValue from './utils/get-new-value'
import getNewItem from './utils/get-new-item'
import getPersistedValue from './utils/get-persisted-value'

export default function createPersistedState(storageKey: string, storage: Storage): [PersistedState, () => void] {
  const safeStorageKey = `persisted_state_hook:${storageKey}`
  const clear = (): void => {
    storage.remove(safeStorageKey)
  }

  const readPersisted = <T>(key: string, initialValue: T): T =>
    getPersistedValue<T>(key, initialValue, storage.get(safeStorageKey)[safeStorageKey])

  const usePersistedState = <T>(key: string, initialValue: T): UsePersistedState<T> => {
    // Read through the initializer: the hook runs on every render, so storage stays out of the render path.
    const [state, setState] = useState<T>(() => readPersisted(key, initialValue))

    // Updater functions must resolve against the last applied value, not the render closure's.
    const latestValue = useRef(state)

    const applyValue = useCallback((value: T): void => {
      latestValue.current = value

      setState(value)
    }, [])

    // A new key must be read before anything is written, or the next update stores the old key's value under it.
    const renderedKey = useRef(key)

    if (renderedKey.current !== key) {
      renderedKey.current = key

      applyValue(readPersisted(key, initialValue))
    }

    const pendingOwnWrites = useRef<string[]>([])

    const setPersistedState = useCallback(
      (newState: React.SetStateAction<T>): void => {
        const newValue = getNewValue<T>(newState, latestValue.current)

        applyValue(newValue)

        const persistedItem = storage.get(safeStorageKey)[safeStorageKey]
        let newItem: string

        try {
          newItem = getNewItem<T>(key, persistedItem, newValue)
        } catch {
          // A write replaces the whole entry, so an unreadable one is skipped rather than rebuilt without other keys.
          return
        }

        recordOwnWrite(pendingOwnWrites, newItem)

        storage.set({ [safeStorageKey]: newItem })
      },
      [key, applyValue],
    )

    useStorageHandler<T>(key, safeStorageKey, applyValue, storage, initialValue, pendingOwnWrites)

    return [state, setPersistedState]
  }

  return [usePersistedState, clear]
}
