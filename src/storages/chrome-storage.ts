import type { AsyncStorage } from '../@types/storage'
import { type Area, createListenerRegistry, toStorageChanges, toStoredItems } from '../utils/extension-storage'

const registry = createListenerRegistry()

chrome.storage.onChanged.addListener((changes, area) => {
  registry.fire(toStorageChanges(changes), area)
})

// chrome.storage is callback-based, unlike its promise-based firefox counterpart.
const createStorage = (storage: chrome.storage.StorageArea, area: Area): AsyncStorage => ({
  get: keys =>
    new Promise(resolve => {
      storage.get(keys, items => {
        resolve(toStoredItems(items))
      })
    }),
  set: items =>
    new Promise(resolve => {
      storage.set(items, resolve)
    }),
  remove: keys =>
    new Promise(resolve => {
      storage.remove(keys, resolve)
    }),
  onChanged: registry.createOnChanged(area),
})

const local = createStorage(chrome.storage.local, 'local')
const sync = createStorage(chrome.storage.sync, 'sync')
const managed = createStorage(chrome.storage.managed, 'managed')

export { local, sync, managed }
