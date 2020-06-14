import { AsyncStorage, StorageChange, StorageChangeEvent, StorageChangeListener } from '../@types/storage'

const listeners = {
  local: new Set<StorageChangeListener>(),
  sync: new Set<StorageChangeListener>(),
  managed: new Set<StorageChangeListener>(),
}

type Area = keyof typeof listeners

function fireStorageEvent(changes: { [key: string]: StorageChange }, area: Area) {
  listeners[area].forEach(listener => {
    listener(changes)
  })
}

chrome.storage.onChanged.addListener((changes, area) => {
  fireStorageEvent(changes, area as Area)
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
      resolve(items)
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
