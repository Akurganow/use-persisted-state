// Publish retries must skip an existing exact version.
// Only E404 proves absence; every other lookup failure stops the release.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// release-it already wrote the version carried by the pushed tag.
const { name, version } = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const spec = `${name}@${version}`

const readErrorCode = stdout => {
  try {
    return JSON.parse(stdout).error?.code ?? null
  } catch {
    return null
  }
}

// Use a shell because npm is a .cmd shim on Windows; spec comes from this manifest.
const view = spawnSync(`npm view ${spec} version --json`, {
  cwd: packageRoot,
  encoding: 'utf8',
  shell: true,
})

if (view.error) {
  console.error(`Could not run npm view for ${spec}: ${view.error.message}`)
  process.exit(1)
}

if (view.status === 0) {
  console.log(`${spec} is already on the registry — skipping publish, the release continues.`)
  process.exit(0)
}

const reportedCode = readErrorCode(view.stdout)

if (reportedCode !== 'E404') {
  console.error(`Could not determine whether ${spec} is published; npm reported ${reportedCode ?? 'no error code'}.`)
  console.error(view.stderr?.trim() ?? '')
  process.exit(1)
}

console.log(`${spec} is not on the registry — publishing.`)

const publish = spawnSync('npm publish', { cwd: packageRoot, stdio: 'inherit', shell: true })

if (publish.error) {
  console.error(`Could not run npm publish for ${spec}: ${publish.error.message}`)
  process.exit(1)
}

process.exit(publish.status ?? 1)
