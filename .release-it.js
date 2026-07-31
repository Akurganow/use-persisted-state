// The whole release-it configuration lives here rather than in package.json, because the piece
// that matters most — whatBump — is a function, and package.json cannot hold one. release-it
// merges both sources, so splitting the configuration would leave two of it.

// A commit type earns a release; everything else rides along in the changelog without causing
// one. `feat` and `fix` are the semver-bearing types, and `perf` joins them because a
// performance change alters observable runtime behaviour for consumers. Anything else — chore,
// docs, ci, build, refactor, style, test — is invisible from the outside of the package.
//
// This is narrower than the preset, which also bumps on `revert`, so a push carrying nothing but
// a `revert:` publishes nothing here.
const RELEASABLE_TYPES = new Set(['feat', 'feature', 'fix', 'perf'])

/**
 * Decides the increment for a set of commits, or that there should be no release at all.
 *
 * The preset's own answer for a history that earns nothing is not stable across its versions —
 * `conventionalcommits@8` floored at patch, so even an empty history resolved to one, while
 * `10.2.1` returns no release — and a push-triggered release is only safe under the second.
 * Returning a null releaseType states that here rather than inheriting it from whichever version
 * of a transitive dependency the lock happens to resolve.
 */
function whatBump(commits) {
  let breaking = 0
  let features = 0
  let releasable = 0

  for (const commit of commits) {
    // A breaking change counts wherever it is declared, including on a type that would not
    // otherwise earn a release.
    breaking += commit.notes.length

    if (commit.type === 'feat' || commit.type === 'feature') features += 1
    if (RELEASABLE_TYPES.has(commit.type)) releasable += 1
  }

  if (breaking === 0 && releasable === 0) {
    return { level: null, releaseType: null, reason: 'No commit earns a release' }
  }

  const reason = `There are ${breaking} BREAKING CHANGES and ${features} features`

  if (breaking > 0) return { level: 0, releaseType: 'major', reason }
  if (features > 0) return { level: 1, releaseType: 'minor', reason }

  return { level: 2, releaseType: 'patch', reason }
}

module.exports = {
  hooks: {
    'before:init': ['npm run lint', 'npm run typecheck', 'npm test', 'npm run build', 'npm run check:package'],
    // The placeholders below are release-it's own and have to survive as literal text. Making it
    // a JS template literal would resolve them when this file loads, where none of them exist.
    // biome-ignore lint/suspicious/noTemplateCurlyInString: resolved by release-it, not by JS
    'after:release': 'echo Successfully released ${name} v${version} to ${repo.repository}.',
  },
  npm: {
    skipChecks: true,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'conventionalcommits',
      infile: 'CHANGELOG.md',
      whatBump,
    },
  },
}
