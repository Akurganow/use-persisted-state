// Runs every package gate and reports all of them. Chained with `&&` they hid
// each other: attw exits non-zero for reasons the CJS build cannot change, so
// the smoke matrix never ran at all and nothing proved the exports map resolved.
// execSync/spawnSync go through a shell on purpose: npm is a .cmd shim on
// Windows.
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Smoke runs first because it is the only check that resolves the published
// specifiers for real; the rest only describe the shape of what resolved.
// `check:attw` excludes the legacy ./lib entry point — docs/packaging.md
// records which rules that drops and why they cannot be satisfied.
const checks = ['check:smoke', 'check:types', 'check:publint', 'check:attw']

const failures = []

for (const script of checks) {
  console.log(`\n=== ${script} ===`)

  // The whole command goes in as one string rather than as an args array:
  // with `shell: true` Node deprecates the array form (DEP0190), and every run
  // printed the warning. The script names are literals from the list above.
  const { status } = spawnSync(`npm run ${script}`, { cwd: packageRoot, stdio: 'inherit', shell: true })

  if (status !== 0) {
    failures.push(script)
  }
}

console.log('')
for (const script of checks) {
  console.log(`${failures.includes(script) ? 'FAIL' : '  ok'}  ${script}`)
}

if (failures.length > 0) {
  console.error(`\n${failures.length} of ${checks.length} package checks failed: ${failures.join(', ')}`)
  process.exit(1)
}

console.log(`\nAll ${checks.length} package checks passed`)
