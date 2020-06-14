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

browser.storage.onChanged.addListener((changes, area) => {
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

const createStorage = (storage: browser.storage.StorageArea, area: Area): AsyncStorage => ({
  get: storage.get,
  set: storage.set,
  remove: storage.remove,
  onChanged: createOnChanged(area),
})

const local = createStorage(browser.storage.local, 'local')
const sync = createStorage(browser.storage.sync, 'sync')
const managed = createStorage(browser.storage.managed, 'managed')

export {
  local,
  sync,
  managed,
}
