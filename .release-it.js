// Keep function-valued release policy in one config; release-it merges package.json with this file.

// Reverts must release so corrective history reaches consumers.
const RELEASABLE_TYPES = new Set(['feat', 'feature', 'fix', 'perf', 'revert'])

/**
 * Decides the increment for a set of commits, or that there should be no release at all.
 *
 * Explicit null prevents dependency defaults from releasing non-product commits.
 */
function whatBump(commits) {
  let breaking = 0
  let features = 0
  let releasable = 0

  for (const commit of commits) {
    // Breaking notes release independently of the commit type.
    breaking += commit.notes.length

    // The parser exposes git reverts outside commit.type.
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

    // Publish only after the release commit and tag reach origin/main; the script makes retries safe.
    'before:github:release': 'node scripts/publish-release.mjs',

    // release-it resolves these placeholders after this file loads.
    // biome-ignore lint/suspicious/noTemplateCurlyInString: resolved by release-it, not by JS
    'after:release': 'echo Successfully released ${name} v${version} to ${repo.repository}.',
  },
  git: {
    // Deploy-key pushes start workflows, so the release commit must skip CI.
    // biome-ignore lint/suspicious/noTemplateCurlyInString: resolved by release-it, not by JS
    commitMessage: 'chore(release): ${version} [skip ci]',
  },
  npm: {
    // release-it's npm phase precedes git push; the hook above preserves the required ordering.
    publish: false,
    // OIDC supplies no token for release-it's npm whoami check.
    skipChecks: true,
  },
  github: {
    // GitHub releases are part of the published release contract.
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
