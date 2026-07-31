// Type-level aliases of the build output rather than restated signatures: a
// copy keeps compiling after src changes and hands ESM consumers stale types
// while CJS consumers get the current ones.
export { default, createPersistedState, createAsyncPersistedState } from '../lib/index.js'
export type {
  AsyncStorage,
  PersistedState,
  Storage,
  StorageChange,
  StorageChangeEvent,
  StorageChangeListener,
  UsePersistedState,
} from '../lib/index.js'
