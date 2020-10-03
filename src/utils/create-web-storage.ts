import { Storage, StorageChange, StorageChangeEvent, StorageChangeListener } from '../@types/storage'

const listeners = new Set<StorageChangeListener>()

function fireStorageEvent(changes: { [key: string]: StorageChange }) {
  listeners.forEach(listener => {
    listener(changes)
  })
}

window.addEventListener('storage', event => {
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

    if (Array.isArray(keys)) {
      keys.forEach(key => {
        const item = typeof storage !== 'undefined' ? storage.getItem(key) : undefined

        if (item) result[key] = item
      })
    } else {
      const item = typeof storage !== 'undefined' ? storage.getItem(keys) : undefined

      if (item) result[keys] = item
    }

    return result
  },
  set: items => {
    const changes: { [key: string]: StorageChange } = {}

    Object.entries(items).forEach(([key, value]) => {
      const oldValue = typeof storage !== 'undefined' ? storage.getItem(key) : undefined

      if (typeof storage !== 'undefined') {
        storage.setItem(key, value)

        changes[key] = {
          oldValue,
          newValue: value,
        }
      }
    })

    if (Object.keys(changes).length > 0) fireStorageEvent(changes)
  },
  remove: keys => {
    const changes: { [key: string]: StorageChange } = {}

    if (Array.isArray(keys)) {
      keys.forEach(key => {
        const oldValue = typeof storage !== 'undefined' ? storage.getItem(key) : undefined

        if (typeof storage !== 'undefined') {
          storage.removeItem(key)

          changes[key] = {
            oldValue,
            newValue: null,
          }
        }
      })
    } else {
      const oldValue = typeof storage !== 'undefined' ? storage.getItem(keys) : undefined

      if (typeof storage !== 'undefined') {
        storage.removeItem(keys)

        changes[keys] = {
          oldValue,
          newValue: null,
        }
      }
    }

    if (Object.keys(changes).length > 0) fireStorageEvent(changes)
  },
  onChanged,
})

