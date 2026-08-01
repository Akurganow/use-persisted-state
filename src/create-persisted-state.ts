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
    // Reading through the initializer keeps the storage out of the render path:
    // the hook runs on every render of every consuming component, so a re-read is
    // only warranted when the key it is asked for actually changes.
    const [state, setState] = useState<T>(() => readPersisted(key, initialValue))

    // The setter must resolve updater functions against the last value applied,
    // not against the one captured by the render that created it. Reading the
    // render closure collapses updates batched into a single event.
    const latestValue = useRef(state)

    const applyValue = useCallback((value: T): void => {
      latestValue.current = value

      setState(value)
    }, [])

    // A mounted hook handed a different key has to show that key's value before
    // anything can be written, or the next update stores the previous key's value
    // under the new key and destroys what was there. Adjusting during render ties
    // the re-read to the change itself, where an effect would cost a read and a
    // second render on every mount as well.
    const renderedKey = useRef(key)

    if (renderedKey.current !== key) {
      renderedKey.current = key

      applyValue(readPersisted(key, initialValue))
    }

    // The entries this hook has written and not yet seen reported back.
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
          // Refused, and reported where it was refused. A write replaces the whole
          // entry, so an entry that cannot be read is one no write can be built on
          // without dropping every other hook's key; skipping leaves the bytes for
          // a repair to reach. The caller keeps what it set, unpersisted.
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
