// The whole release-it configuration lives here rather than in package.json, because the piece
// that matters most — whatBump — is a function, and package.json cannot hold one. release-it
// merges both sources, so splitting the configuration would leave two of it.

// A commit type earns a release; everything else rides along in the changelog without causing
// one. `feat` and `fix` are the semver-bearing types, and `perf` joins them because a
// performance change alters observable runtime behaviour for consumers. `revert` earns one
// because undoing a released change has to reach consumers — without it the broken version stays
// the newest thing on the registry, which is the worst moment to publish nothing. Anything else —
// chore, docs, ci, build, refactor, style, test — is invisible from outside the package.
const RELEASABLE_TYPES = new Set(['feat', 'feature', 'fix', 'perf', 'revert'])

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

    // `git revert` writes its own subject and leaves no conventional type, so the parser reports
    // the revert separately. Reading it the way the preset does keeps both spellings releasable.
    const type = commit.revert ? 'revert' : commit.type

    if (type === 'feat' || type === 'feature') features += 1
    if (RELEASABLE_TYPES.has(type)) releasable += 1
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
  git: {
    // `[skip ci]` is what stops the release from releasing again. The release commit is pushed
    // with a deploy key rather than GITHUB_TOKEN, and a deploy key push does start workflows, so
    // without the marker this commit would trigger the push-triggered release that produced it.
    // GitHub reads the marker anywhere in the message, on push and pull_request events:
    // https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs
    //
    // `chore(release):` keeps the commit conventional like every other one on main, and `chore`
    // earns no release of its own, so the marker is a second line of defence rather than the only
    // one.
    // biome-ignore lint/suspicious/noTemplateCurlyInString: resolved by release-it, not by JS
    commitMessage: 'chore(release): ${version} [skip ci]',
  },
  npm: {
    // Under OIDC there is no token for `npm whoami` to report, so the prerequisite checks fail on
    // an authentication that is in fact working. See release-it's docs/npm.md (Trusted Publishing)
    // and release-it#1244.
    skipChecks: true,
  },
  github: {
    // Off by default, and the reason a release run produced no GitHub release before. The body is
    // filled from the generated changelog without further configuration.
    release: true,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'conventionalcommits',
      infile: 'CHANGELOG.md',
      whatBump,
    },
  },
}
