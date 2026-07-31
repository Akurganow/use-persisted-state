// Packs the library and installs the tarball into a throwaway consumer, so the
// checks in smoke-consumer.mjs exercise exactly what npm would publish — the
// exports map, the files whitelist and the packed file set — not the worktree.
// execSync goes through a shell on purpose: `npm` is a .cmd shim on Windows,
// and every interpolated value is a path this script created itself.
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

if (!existsSync(join(packageRoot, 'lib', 'index.js'))) {
  console.error('lib/ is missing, run `npm run build` before the smoke check')
  process.exit(1)
}

const workDir = mkdtempSync(join(tmpdir(), 'use-persisted-state-smoke-'))

try {
  const packReport = JSON.parse(
    execSync(`npm pack --json --pack-destination "${workDir}"`, { cwd: packageRoot, encoding: 'utf8' }),
  )
  const tarball = join(workDir, packReport[0].filename)

  const consumerDir = join(workDir, 'consumer')
  mkdirSync(consumerDir)
  writeFileSync(
    join(consumerDir, 'package.json'),
    `${JSON.stringify({ name: 'smoke-consumer', private: true }, null, 2)}\n`,
  )
  execSync(`npm install --no-audit --no-fund --ignore-scripts "${tarball}"`, { cwd: consumerDir, stdio: 'inherit' })

  cpSync(join(packageRoot, 'scripts', 'smoke-consumer.mjs'), join(consumerDir, 'smoke-consumer.mjs'))
  execSync('node smoke-consumer.mjs', { cwd: consumerDir, stdio: 'inherit' })
} catch (error) {
  console.error(`Smoke check failed, work directory kept for inspection: ${workDir}`)
  throw error
}

rmSync(workDir, { recursive: true, force: true })
