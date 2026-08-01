import type { AsyncStorage } from '../@types/storage'
import { type Area, createListenerRegistry, toStorageChanges, toStoredItems } from '../utils/extension-storage'

const registry = createListenerRegistry()

chrome.storage.onChanged.addListener((changes, area) => {
  registry.fire(toStorageChanges(changes), area)
})

/**
 * Passing no callback is what selects chrome.storage's promise form, and the
 * two cannot be combined. It is the only form that reports a failure the caller
 * can act on: the callback form leaves the reason in `runtime.lastError` and
 * invokes the callback with no arguments, giving a wrapping promise nothing to
 * settle on.
 *
 * Each call goes through `storage` rather than a torn-off method reference. A
 * `StorageArea` method invoked without its receiver throws `Illegal
 * invocation`, unlike its firefox counterpart.
 *
 * `get` stays declared `async` so that asking whether this storage is
 * asynchronous can be answered from the function itself; probing it by calling
 * would cost a round trip to the extension process on every hook creation.
 */
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
