import React, { useState, useEffect } from 'react'

import isFunction from './utils/is-function'

type UsePersistedState<T> = [T, (value: T | ((previousState: T) => T)) => void]

export default function createPersistedState(
  storageKey: string,
  storage: Storage = window.localStorage,
): [<T>(key: string, initialValue: T) => UsePersistedState<T>, () => void] {
  const safeStorageKey = `persisted_state_hook:${storageKey}`
  const clear = (): void => {
    const oldValue = storage.getItem(safeStorageKey)
    storage.removeItem(safeStorageKey)
    window.dispatchEvent(new StorageEvent('storage', { key: safeStorageKey, oldValue }))
  }

  const usePersistedState = <T>(key: string, initialValue: T): UsePersistedState<T> => {
    let initialPersist: { [x: string]: unknown }

    try {
      const persist = storage.getItem(safeStorageKey)
      initialPersist = persist ? JSON.parse(persist) : {}
    } catch (ignore) {
      initialPersist = {}
    } // eslint-disable-line no-empty

    let initialOrPersistedValue = initialValue

    if (initialPersist && key in initialPersist) {
      initialOrPersistedValue = (initialPersist[key] as T) || initialValue
    }

    const [state, setState] = useState<T>(initialOrPersistedValue)

    const setPersistedState = (newState: React.SetStateAction<T>): void => {
      let newValue

      if (isFunction(newState)) {
        newValue = newState(state)
        setState(newValue)
      } else {
        setState(newState)
        newValue = newState
      }

      let persist = storage.getItem(safeStorageKey)

      persist = persist ? JSON.parse(persist) : {}

      const newItem = JSON.stringify(
        Object.assign(persist, {
          [key]: newValue,
        }),
      )

      storage.setItem(safeStorageKey, newItem)
      window.dispatchEvent(new StorageEvent('storage', { key: safeStorageKey, newValue: newItem }))
    }

    useEffect(() => {
      const handleStorage = (event: StorageEvent): void => {
        if (event.key === safeStorageKey && event.newValue === null && event.oldValue !== null) {
          let oldState = null

          try {
            oldState = JSON.parse(event.oldValue)
          } catch (e) {
            console.error('use-persisted-state: Can\'t parse old value from storage', e)
          }

          const oldValue = oldState && key in oldState ? oldState[key] as T : null

          if (oldValue !== initialValue) setState(initialValue)
        }

        if (event.key === safeStorageKey && event.newValue !== null) {
          let newState = null

          try {
            newState = JSON.parse(event.newValue)
          } catch (e) {
            console.error('use-persisted-state: Can\'t parse new value from storage', e)
          }

          const newValue = newState && key in newState ? newState[key] as T : null

          if (newValue !== null) {
            setState(newValue)
          }
        }
      }

      window.addEventListener('storage', handleStorage)
      return () => {
        window.removeEventListener('storage', handleStorage)
      }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return [state, setPersistedState]
  }

  return [usePersistedState, clear]
}
