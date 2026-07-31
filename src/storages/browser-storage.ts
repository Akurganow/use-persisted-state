import { AsyncStorage } from '../@types/storage'
import { Area, createListenerRegistry, toStorageChanges, toStoredItems } from '../utils/extension-storage'

const registry = createListenerRegistry()

browser.storage.onChanged.addListener((changes, area) => {
  registry.fire(toStorageChanges(changes), area)
})

// browser.storage is promise-based, unlike its callback-based chrome counterpart.
const createStorage = (storage: browser.storage.StorageArea, area: Area): AsyncStorage => ({
  get: async keys => toStoredItems(await storage.get(keys)),
  set: storage.set,
  remove: storage.remove,
  onChanged: registry.createOnChanged(area),
})

const local = createStorage(browser.storage.local, 'local')
const sync = createStorage(browser.storage.sync, 'sync')
const managed = createStorage(browser.storage.managed, 'managed')

export {
  local,
  sync,
  managed,
}
