// Resolution stub for tooling that predates the exports map: TypeScript's
// node10 resolver and older bundlers look for a real file at this path and
// would otherwise fail. Node 16+ never reaches this file — the exports map
// answers first. Each area is re-exported by reference, so both paths hand out
// the same adapter instance and the listener registry stays single.
const source = require('../lib/storages/browser-storage.js')

Object.defineProperty(exports, '__esModule', { value: true })
exports.local = source.local
exports.sync = source.sync
exports.managed = source.managed
