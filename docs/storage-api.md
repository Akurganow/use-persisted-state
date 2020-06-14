# Storage

Storage API is similar to the browser.storage but with a few exceptions

## Methods
For async storage all methods should return `Promise` 
### get `(keys: string | string[]) => string | Promise<string>`
Retrieves one or more items from the storage.
### set `(items: { [k: string]: string }) => void | Promise<void>`
Stores one or more items in the storage.
### remove `(keys: string | string[]) => void | Promise<void>`
Removes one or more items from the storage

## `onChanged`
Fired when one or more items change

### addListener
Adds a listener to storage change event
### removeListener
Stop listening to storage change event. The `listener` argument is the listener to remove
### hasListener
Check whether `listener` is registered for this event. Returns true if it is listening, false otherwise
