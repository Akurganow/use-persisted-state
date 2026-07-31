// Publishes the package, unless this exact version is already on the registry.
//
// A release can fail after the tag is pushed but before the GitHub release exists: the tag is on
// origin, the version may already be on npm, and nothing has finished the job. Re-running the
// release is the recovery, and that only works if publishing twice is harmless. npm refuses to
// replace a published version, so a plain `npm publish` would fail the retry on its first step
// and leave the release permanently unfinishable.
//
// Only a 404 is read as "not published yet". Every other failure — an unreachable registry above
// all — fails the release instead. Treating those as "nothing to publish" would report a green
// release for a package that never reached the registry, which is the one outcome worse than
// stopping.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// release-it rewrote this during its bump phase, and the tag it pushed carries the same version.
const { name, version } = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const spec = `${name}@${version}`

const readErrorCode = stdout => {
  try {
    return JSON.parse(stdout).error?.code ?? null
  } catch {
    return null
  }
}

// Both commands go through a shell on purpose: npm is a .cmd shim on Windows. The spec is built
// from this package's own manifest, so there is nothing external to quote.
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

// npm reports a missing version and a missing package alike, as E404 in its JSON error. Anything
// else is a registry that could not answer the question, not an answer of "no".
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
