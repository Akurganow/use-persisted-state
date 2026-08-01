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

  // Every hook this factory makes lives in one entry, and storing a value means
  // reading that entry, merging one key into it and writing all of it back, with
  // a suspension point on either side of the merge. Left to overlap, a second
  // writer merges into a snapshot taken before the first one landed and stores
  // it: the first writer's key is gone from storage while its value is still on
  // screen, and nothing reports the disagreement. It is the entry, not the hook,
  // that has to be taken one at a time, so the chain belongs to the factory.
  let entryWrites: Promise<unknown> = Promise.resolve()

  const clear = (): Promise<void> => {
    // Removing the entry changes it as much as storing does, so it takes its turn
    // in the same chain. Outside it, a write already queued lands after the
    // removal and brings back what was cleared - and "clear this data" is the one
    // request that cannot be allowed to half happen.
    const removal = entryWrites.then(() => storage.remove(safeStorageKey))

    entryWrites = removal.catch(() => undefined)

    return removal
  }

  const commitEntry = <T>(key: string, newValue: T, pendingOwnWrite: React.RefObject<string | null>): Promise<void> => {
    const write = entryWrites.then(async () => {
      const persistedItem = await storage.get(safeStorageKey)
      let newItem: string

      try {
        newItem = getNewItem<T>(key, persistedItem[safeStorageKey], newValue)
      } catch {
        // Refused, and reported where it was refused. A write replaces the whole
        // entry, so an entry that cannot be read is one no write can be built on
        // without dropping every other hook's key; skipping leaves the bytes for
        // a repair to reach. The caller keeps what it set, unpersisted.
        return
      }

      // Recorded before the write, because the backend may report it before the
      // promise settles.
      pendingOwnWrite.current = newItem

      await storage.set({ [safeStorageKey]: newItem })
    })

    // The chain has to outlive a failed write, or one backend rejection stops
    // every later write on this entry. The rejection itself is not swallowed: it
    // stays on the promise handed back to the caller that asked for the write.
    entryWrites = write.catch(() => undefined)

    return write
  }

  const usePersistedState = <T>(key: string, initialValue: T | (() => T)): UsePersistedState<T> => {
    const [state, setState] = useState<T>(initialValue)

    // The setter must resolve updater functions against the last value applied,
    // not against the one captured by the render that created it. Reading the
    // render closure collapses updates batched into a single event.
    const latestValue = useRef(state)

    // Whether anything has already put a value in place. A load that settles after
    // the caller set one must not revert it, and no signal local to the load can
    // answer this: the write it loses to happens outside the load entirely.
    const hasAppliedValue = useRef(false)

    const applyValue = useCallback((value: T): void => {
      latestValue.current = value
      hasAppliedValue.current = true

      setState(value)
    }, [])

    // The exact entry this hook last wrote and has not yet seen reported back.
    const pendingOwnWrite = useRef<string | null>(null)

    const setPersistedState = useCallback(
      async (newState: React.SetStateAction<T>): Promise<void> => {
        const newValue = getNewValue<T>(newState, latestValue.current)

        // Applied before the write is even queued: the caller sees its value at
        // once, and only the trip to storage waits its turn.
        applyValue(newValue)

        await commitEntry<T>(key, newValue, pendingOwnWrite)
      },
      [key, applyValue],
    )

    // As in `useState`, the value the load falls back to is the one given on the
    // first render. Later identities of an inline object must not reload, or the
    // effect re-runs on every render and never settles.
    const mountInitialValue = useRef(initialValue)

    // Subscribed before the load below, and the order is load-bearing: React runs
    // effects in declaration order, so reading first would leave an interval
    // between the read and the subscription in which a write belongs to neither
    // and is lost. Reading last covers everything written before the subscription
    // began, and the listener covers everything after.
    useStorageHandler<T>(key, safeStorageKey, applyValue, storage, initialValue, pendingOwnWrite)

    useEffect(() => {
      // Two separate questions, and one cell cannot hold both: whether this load
      // is still the current one, which only the closure it belongs to can answer,
      // and whether a value has been applied meanwhile, which outlives it. A load
      // abandoned by a key change would otherwise read the flag its successor had
      // just set, apply the previous key's value and shut the successor out. The
      // second question is also what makes subscribing first safe: a value the
      // listener delivers while the load is in flight is not overwritten by it.
      let isCancelled = false

      hasAppliedValue.current = false

      const loadPersistedValue = async (): Promise<void> => {
        try {
          const persist = await storage.get(safeStorageKey)

          if (isCancelled || hasAppliedValue.current) return

          applyValue(getPersistedValue<T>(key, mountInitialValue.current, persist[safeStorageKey]))
        } catch (err) {
          // An extension backend rejects on a quota error or an invalidated
          // extension context. Nothing awaits this load, so an unclaimed
          // rejection terminates the process on Node 15+ and surfaces as an
          // uncaught error in the browser. The initial value is already in
          // state, so the mount stands on it and the failure is reported rather
          // than swallowed, as the synchronous path reports its own.
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
