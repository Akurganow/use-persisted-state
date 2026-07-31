import type { Storage, StorageChange, StorageChangeEvent, StorageChangeListener } from '../@types/storage'

const listeners = new Set<StorageChangeListener>()

function fireStorageEvent(changes: { [key: string]: StorageChange }) {
  for (const listener of listeners) {
    listener(changes)
  }
}

globalThis.addEventListener('storage', event => {
  if (event.key) {
    const changes = {
      [event.key]: {
        newValue: event.newValue,
        oldValue: event.oldValue,
      },
    }

    fireStorageEvent(changes)
  }
})

function toKeyList(keys: string | string[]): string[] {
  return Array.isArray(keys) ? keys : [keys]
}

const onChanged: StorageChangeEvent = {
  addListener(listener) {
    listeners.add(listener)
  },
  removeListener(listener) {
    listeners.delete(listener)
  },
  hasListener(listener) {
    return listeners.has(listener)
  },
}

export default (storage: globalThis.Storage): Storage => ({
  get: keys => {
    const result: { [key: string]: string } = {}

    for (const key of toKeyList(keys)) {
      const item = typeof storage !== 'undefined' ? storage.getItem(key) : undefined

      if (item) result[key] = item
    }

    return result
  },
  set: items => {
    const changes: { [key: string]: StorageChange } = {}

    for (const [key, value] of Object.entries(items)) {
      const oldValue = typeof storage !== 'undefined' ? storage.getItem(key) : undefined

      if (typeof storage !== 'undefined') {
        storage.setItem(key, value)

        changes[key] = {
          oldValue,
          newValue: value,
        }
      }
    }

    if (Object.keys(changes).length > 0) fireStorageEvent(changes)
  },
  remove: keys => {
    const changes: { [key: string]: StorageChange } = {}

    for (const key of toKeyList(keys)) {
      const oldValue = typeof storage !== 'undefined' ? storage.getItem(key) : undefined

      if (typeof storage !== 'undefined') {
        storage.removeItem(key)

        changes[key] = {
          oldValue,
          newValue: null,
        }
      }
    }

    if (Object.keys(changes).length > 0) fireStorageEvent(changes)
  },
  onChanged,
})
