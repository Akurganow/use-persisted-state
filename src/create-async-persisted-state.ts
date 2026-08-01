import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import useStorageHandler from './utils/use-storage-handler'
import getNewValue from './utils/get-new-value'
import getNewItem from './utils/get-new-item'
import getPersistedValue from './utils/get-persisted-value'

import type { AsyncStorage } from './@types/storage'
import type { PersistedState, UsePersistedState } from './@types/hook'

export default function createAsyncPersistedState<S extends AsyncStorage>(
  storageKey: string,
  storage: S,
): [PersistedState, () => Promise<void>] {
  const safeStorageKey = `persisted_state_hook:${storageKey}`

  // Storing is read-merge-write on one shared entry, so overlapping writers would drop each other's keys.
  let entryWrites: Promise<unknown> = Promise.resolve()

  const clear = (): Promise<void> => {
    // In the same chain as writes, or a queued write lands after the removal and restores what was cleared.
    const removal = entryWrites.then(() => storage.remove(safeStorageKey))

    entryWrites = removal.catch(() => undefined)

    return removal
  }

  const commitEntry = <T>(key: string, newValue: T): Promise<void> => {
    const write = entryWrites.then(async () => {
      const persistedItem = await storage.get(safeStorageKey)
      let newItem: string

      try {
        newItem = getNewItem<T>(key, persistedItem[safeStorageKey], newValue)
      } catch {
        // A write replaces the whole entry, so an unreadable one is skipped rather than rebuilt without other keys.
        return
      }

      await storage.set({ [safeStorageKey]: newItem })
    })

    // The chain must outlive a failed write; the rejection still reaches the caller through `write`.
    entryWrites = write.catch(() => undefined)

    return write
  }

  const usePersistedState = <T>(key: string, initialValue: T | (() => T)): UsePersistedState<T> => {
    const [state, setState] = useState<T>(initialValue)

    // Updater functions must resolve against the last applied value, not the render closure's.
    const latestValue = useRef(state)

    // A load that settles after the caller set a value must not revert it.
    const hasAppliedValue = useRef(false)

    const applyValue = useCallback((value: T): void => {
      latestValue.current = value
      hasAppliedValue.current = true

      setState(value)
    }, [])

    const setPersistedState = useCallback(
      async (newState: React.SetStateAction<T>): Promise<void> => {
        const newValue = getNewValue<T>(newState, latestValue.current)

        applyValue(newValue)

        await commitEntry<T>(key, newValue)
      },
      [key, applyValue],
    )

    // The first render's initial value: reloading on a later identity would re-run the effect forever.
    const mountInitialValue = useRef(initialValue)

    // Subscribed before the load: effects run in declaration order, and reading first would lose writes in between.
    useStorageHandler<T>(key, safeStorageKey, applyValue, storage, initialValue)

    useEffect(() => {
      // Separate from `hasAppliedValue`: only this closure knows whether its own load is still current.
      let isCancelled = false

      hasAppliedValue.current = false

      const loadPersistedValue = async (): Promise<void> => {
        try {
          const persist = await storage.get(safeStorageKey)

          if (isCancelled || hasAppliedValue.current) return

          applyValue(getPersistedValue<T>(key, mountInitialValue.current, persist[safeStorageKey]))
        } catch (err) {
          // Nothing awaits this load, so an unclaimed rejection would surface as an uncaught error.
          console.error("use-persisted-state: Can't read value from storage", err)
        }
      }

      loadPersistedValue()

      return () => {
        isCancelled = true
      }
    }, [key, applyValue])

    return [state, setPersistedState]
  }

  return [usePersistedState, clear]
}
