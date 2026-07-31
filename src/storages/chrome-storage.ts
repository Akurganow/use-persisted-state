import { AsyncStorage, StorageChange, StorageChangeEvent, StorageChangeListener } from '../@types/storage'

const listeners = {
  local: new Set<StorageChangeListener>(),
  sync: new Set<StorageChangeListener>(),
  managed: new Set<StorageChangeListener>(),
}

type Area = keyof typeof listeners

// chrome.storage holds arbitrary JSON, while this library only ever writes
// serialized strings. Anything else under a key belongs to other code: it is
// reported as absent rather than passed on as if this library had written it,
// which is what the previous code did until it failed to parse.
function toStoredValue(value: unknown): string | null | undefined {
  if (value === undefined) return undefined

  return typeof value === 'string' ? value : null
}

function toStorageChanges(
  changes: { [key: string]: chrome.storage.StorageChange },
): { [key: string]: StorageChange } {
  const result: { [key: string]: StorageChange } = {}

  Object.entries(changes).forEach(([key, change]) => {
    result[key] = {
      oldValue: toStoredValue(change.oldValue),
      newValue: toStoredValue(change.newValue),
    }
  })

  return result
}

function toStoredItems(items: { [key: string]: unknown }): { [key: string]: string } {
  const result: { [key: string]: string } = {}

  Object.entries(items).forEach(([key, value]) => {
    if (typeof value === 'string') result[key] = value
  })

  return result
}

function fireStorageEvent(changes: { [key: string]: StorageChange }, area: Area) {
  listeners[area].forEach(listener => {
    listener(changes)
  })
}

chrome.storage.onChanged.addListener((changes, area) => {
  fireStorageEvent(toStorageChanges(changes), area as Area)
})

function createOnChanged(area: Area): StorageChangeEvent {
  return {
    addListener(listener) {
      listeners[area].add(listener)
    },
    removeListener(listener) {
      listeners[area].delete(listener)
    },
    hasListener(listener) {
      return listeners[area].has(listener)
    },
  }
}

const createStorage = (storage: chrome.storage.StorageArea, area: Area): AsyncStorage => ({
  get: keys => new Promise(resolve => {
    storage.get(keys, items => {
      resolve(toStoredItems(items))
    })
  }),
  set: items => new Promise(resolve => {
    storage.set(items, resolve)
  }),
  remove: keys => new Promise(resolve => {
    storage.remove(keys, resolve)
  }),
  onChanged: createOnChanged(area),
})

const local = createStorage(chrome.storage.local, 'local')
const sync = createStorage(chrome.storage.sync, 'sync')
const managed = createStorage(chrome.storage.managed, 'managed')

export {
  local,
  sync,
  managed,
}
