// Run every package gate so one failure cannot hide later checks.
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Smoke resolves published specifiers; run it before static package checks.
const checks = ['check:smoke', 'check:types', 'check:publint', 'check:attw']

const failures = []

for (const script of checks) {
  console.log(`\n=== ${script} ===`)

  // Fixed script names make the shell safe; a command string supports npm.cmd without DEP0190.
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
