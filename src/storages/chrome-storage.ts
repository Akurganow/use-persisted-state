import type { AsyncStorage } from '../@types/storage'
import { type Area, createListenerRegistry, toStorageChanges, toStoredItems } from '../utils/extension-storage'

const registry = createListenerRegistry()

chrome.storage.onChanged.addListener((changes, area) => {
  registry.fire(toStorageChanges(changes), area)
})

// Passing no callback selects the promise form; the callback form leaves failures in `runtime.lastError`.
// Called through `storage`: a torn-off `StorageArea` method throws `Illegal invocation`, unlike firefox's.
// `get` stays `async` so asking whether this storage is asynchronous costs no round trip to the extension.
const createStorage = (storage: chrome.storage.StorageArea, area: Area): AsyncStorage => ({
  get: async keys => toStoredItems(await storage.get(keys)),
  set: items => storage.set(items),
  remove: keys => storage.remove(keys),
  onChanged: registry.createOnChanged(area),
})

const local = createStorage(chrome.storage.local, 'local')
const sync = createStorage(chrome.storage.sync, 'sync')
const managed = createStorage(chrome.storage.managed, 'managed')

export { local, sync, managed }
