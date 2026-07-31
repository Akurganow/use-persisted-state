// Resolution stub for tooling that predates the exports map: TypeScript's
// node10 resolver and older bundlers look for a real file at this path and
// would otherwise fail. Node 16+ never reaches this file — the exports map
// answers first. The lib module's shape is mirrored rather than re-assigned to
// module.exports, so the declaration beside it stays true for both resolvers.
const source = require('../lib/storages/local-storage.js')

Object.defineProperty(exports, '__esModule', { value: true })
exports.default = source.default
