// Hand-written ES module wrapper over the single CJS build. A second compiled
// ESM copy would duplicate the module-level listener registries, so hooks
// loaded through one module system would stop seeing writes made through the
// other. Values are re-exported through property access because Node's named
// export detection for CJS is heuristic.
import cjs from '../lib/index.js'

export default cjs.default
export const createPersistedState = cjs.createPersistedState
export const createAsyncPersistedState = cjs.createAsyncPersistedState
