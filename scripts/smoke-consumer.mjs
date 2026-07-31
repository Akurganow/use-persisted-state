// Runs inside the throwaway consumer created by smoke.mjs, against the packed
// tarball. Every published specifier must load through both module systems and
// resolve to the single CJS instance — the listener registries are module-level
// state, so a second copy would silently break same-tab synchronisation.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const packageName = '@plq/use-persisted-state'
const requireCjs = createRequire(import.meta.url)

// One list, so adding a backend does not mean remembering every loop below.
// `areas` names the exports an extension backend splits into; a web storage
// backend has none and ships a single default.
const adapters = [
  { name: 'local-storage', areas: [] },
  { name: 'session-storage', areas: [] },
  { name: 'browser-storage', areas: ['local', 'sync', 'managed'] },
  { name: 'chrome-storage', areas: ['local', 'sync', 'managed'] },
]

function createMemoryWebStorage() {
  const items = new Map()

  return {
    getItem: key => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => {
      items.set(key, String(value))
    },
    removeItem: key => {
      items.delete(key)
    },
  }
}

function createExtensionStorageStub() {
  return {
    onChanged: { addListener() {} },
    local: {},
    sync: {},
    managed: {},
  }
}

// defineProperty rather than assignment: Node may ship these as accessors on
// globalThis, and a failed strict-mode assignment would throw before any check.
function defineGlobal(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
}

// The adapters touch the DOM and extension APIs at import time; plain Node has
// neither, so without stubs every non-root entry would fail to load and the
// matrix would silently shrink to the root entry alone.
//
// Both halves of the listener pair are stubbed on purpose. This file checks
// packaging — that the map resolves and that every path reaches one module
// instance. Whether an adapter survives a runtime missing half the pair is a
// property of the adapter and belongs in its own unit test, where the failure
// names itself; here the same failure reads as "packaging is broken" and sends
// the reader after the wrong cause.
defineGlobal('addEventListener', () => {})
defineGlobal('removeEventListener', () => {})
defineGlobal('localStorage', createMemoryWebStorage())
defineGlobal('sessionStorage', createMemoryWebStorage())
defineGlobal('chrome', { storage: createExtensionStorageStub() })
defineGlobal('browser', { storage: createExtensionStorageStub() })

const results = []

async function check(label, action) {
  try {
    await action()
    results.push({ label })
  } catch (error) {
    results.push({ label, error })
  }
}

async function assertNoDrift(specifier) {
  const cjsExports = requireCjs(specifier)
  const namespace = await import(specifier)
  // A transpiler interop marker on the CJS side, not public API.
  const cjsKeys = Object.keys(cjsExports).filter(key => key !== '__esModule')

  // Compared as sets rather than walked from the CJS side, so an export the
  // hand-written wrapper grew and the build output never had is caught too.
  assert.deepEqual(
    Object.keys(namespace).sort(),
    cjsKeys.sort(),
    `require and import of ${specifier} expose different export names`,
  )

  for (const key of cjsKeys) {
    assert(Object.is(namespace[key], cjsExports[key]), `"${key}" differs between require and import of ${specifier}`)
  }
}

async function assertLegacyIdentity(specifier) {
  const cjsExports = requireCjs(specifier)
  const namespace = await import(specifier)

  assert(Object.is(namespace.default, cjsExports), `import of ${specifier} does not expose the require instance`)
}

const specifiers = [
  packageName,
  ...adapters.map(({ name }) => `${packageName}/storages/${name}`),
  `${packageName}/lib`,
  `${packageName}/lib/index.js`,
  ...adapters.flatMap(({ name }) => [`${packageName}/lib/storages/${name}`, `${packageName}/lib/storages/${name}.js`]),
  `${packageName}/lib/@types/storage`,
]

for (const specifier of specifiers) {
  await check(`require ${specifier}`, () => {
    requireCjs(specifier)
  })
  await check(`import ${specifier}`, () => import(specifier))
}

// The exports map answers first on any modern resolver, so the stubs that serve
// TypeScript's node10 resolution can only be reached by their file path. Without
// this check a wrong relative path inside them would ship unnoticed.
// Resolved inside the check rather than at module scope: this lookup goes
// through the exports map too, and at module scope a broken map aborts the file
// before a single check reports, leaving a stack trace instead of a named
// failure.
function resolvePackageRoot() {
  return dirname(requireCjs.resolve(`${packageName}/package.json`))
}

for (const { name } of adapters) {
  await check(`node10 stub: storages/${name}`, () => {
    const stub = requireCjs(join(resolvePackageRoot(), 'storages', `${name}.js`))
    const viaLib = requireCjs(`${packageName}/lib/storages/${name}.js`)

    assert.deepEqual(Object.keys(stub), Object.keys(viaLib), 'stub exposes a different shape than lib')

    for (const key of Object.keys(viaLib)) {
      assert(Object.is(stub[key], viaLib[key]), `"${key}" is a second instance in the stub`)
    }
  })
}

// `files` shipped /src long before this map existed, so these paths already
// resolved for everyone and the map must not take them away. Resolution only:
// the sources are TypeScript, and whether a given runtime can execute them is
// not something the exports map decides.
for (const subpath of ['src/index.ts', 'src/@types/storage.ts']) {
  await check(`compat: ${subpath} still resolves`, () => {
    requireCjs.resolve(`${packageName}/${subpath}`)
  })
}

await check(`require ${packageName}/package.json`, () => {
  assert.equal(requireCjs(`${packageName}/package.json`).name, packageName)
})
await check(`import ${packageName}/package.json`, async () => {
  const namespace = await import(`${packageName}/package.json`, { with: { type: 'json' } })

  assert.equal(namespace.default.name, packageName)
})

await check('identity: root default', async () => {
  const cjsDefault = requireCjs(packageName).default
  const esmDefault = (await import(packageName)).default

  assert.equal(typeof cjsDefault, 'function', 'require default is not a function')
  assert(Object.is(esmDefault, cjsDefault), 'root default differs between require and import')
})

for (const { name } of adapters.filter(adapter => adapter.areas.length === 0)) {
  await check(`identity: storages/${name} default`, async () => {
    const specifier = `${packageName}/storages/${name}`

    assert(Object.is((await import(specifier)).default, requireCjs(specifier).default))
  })
}

for (const { name, areas } of adapters.filter(adapter => adapter.areas.length > 0)) {
  await check(`identity: storages/${name} areas`, async () => {
    const specifier = `${packageName}/storages/${name}`
    const namespace = await import(specifier)
    const cjsExports = requireCjs(specifier)

    for (const area of areas) {
      assert(Object.is(namespace[area], cjsExports[area]), `"${area}" differs between require and import`)
    }
  })
}

await check('identity: new alias resolves to the legacy lib instance', async () => {
  const viaAlias = (await import(`${packageName}/storages/local-storage`)).default
  const viaLegacyPath = requireCjs(`${packageName}/lib/storages/local-storage`).default

  assert(Object.is(viaAlias, viaLegacyPath))
})

await check('identity: legacy ./lib', () => assertLegacyIdentity(`${packageName}/lib`))
await check('identity: legacy ./lib/storages/local-storage.js', () =>
  assertLegacyIdentity(`${packageName}/lib/storages/local-storage.js`),
)

await check('drift: root', () => assertNoDrift(packageName))

for (const { name } of adapters) {
  await check(`drift: storages/${name}`, () => assertNoDrift(`${packageName}/storages/${name}`))
}

await check('cross-style: listener added via import fires on write via require', async () => {
  const esmAdapter = (await import(`${packageName}/storages/local-storage`)).default
  const cjsAdapter = requireCjs(`${packageName}/storages/local-storage`).default
  const received = []
  const listener = changes => {
    received.push(changes)
  }

  esmAdapter.onChanged.addListener(listener)
  try {
    cjsAdapter.set({ 'smoke-key': 'smoke-value' })
  } finally {
    esmAdapter.onChanged.removeListener(listener)
  }

  assert.equal(received.length, 1, 'listener did not fire exactly once')
  assert.equal(received[0]['smoke-key'].newValue, 'smoke-value')
})

const failures = results.filter(result => result.error)

for (const result of results) {
  console.log(`${result.error ? 'FAIL' : '  ok'}  ${result.label}`)
}

if (failures.length > 0) {
  console.error(`\n${failures.length} of ${results.length} smoke checks failed`)
  for (const failure of failures) {
    console.error(`\n${failure.label}\n  ${failure.error.message}`)
  }
  process.exit(1)
}

console.log(`\nAll ${results.length} smoke checks passed`)
