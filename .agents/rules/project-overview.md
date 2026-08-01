---
description: What this library is, its public API surface, commands, and which upgrades are blocked
trigger: always
tags:
  - overview
  - library
  - versioning
---

## Project Overview

`@plq/use-persisted-state` is a published npm library: a React hook that keeps state in a storage
backend. Its supported API is the package root and the documented storage adapter entry points.
Legacy `./lib/*` and compatibility `./src/*` paths remain resolvable, so changes there still need the
compatibility checks described in [packaging](../../docs/packaging.md).

- **Runtime dependencies: `@plq/is` only.** Keep it that way — this package is chosen for being small.
- **Peer:** React >= 16.8 (hooks), supports 18 and 19.
- **Entry point** is `src/index.ts`. Storage adapters live in `src/storages/`, internal helpers in
  `src/utils/`, and public types in `src/@types/`.
- **`lib/` is build output** produced by `tsc`. Never edit it by hand.
- **`demo/`** is a Vite example app and is not published.

### Commands

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Test | `npm test` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Check the published package | `npm run check:package` (needs `npm run build` first) |
| Demo dev server | `npm run demo` |

`typecheck` is the only gate that type-checks the test suite — `ts-jest` transpiles per file without
checking types, so a type error in a test reaches `main` unnoticed without it. `check:package` packs
a tarball, runs the maintained public and compatibility smoke matrix, then checks the wrapper
declarations, `publint` and `attw`; see [packaging](../../docs/packaging.md).

### Versioning

Public API changes follow semver. A behaviour change that users can observe — what the hook returns,
when it re-renders, what lands in storage — is breaking even when the type signature is untouched.
Restoring an established contract is the exception: that is a patch fix even though the correction is
observable. Newly incompatible behaviour remains breaking.

Releases are cut automatically from every push to `main`, so merging a pull request is what publishes.
The version comes from the commit messages alone: only `feat`, `feature`, `fix`, `perf`, `revert` and
a declared breaking change earn one, and a push carrying nothing else ends in "No new version to
release" and a green run, so dependency updates cost a no-op rather than a version.

A release that does happen runs `release-it`, which bumps the version in `package.json`, writes
`CHANGELOG.md`, commits both, tags the commit, pushes the branch and the tag back to `main`,
publishes to npm over OIDC, and creates the GitHub release. Nobody touches the version or the
changelog by hand; the only human action is merging.

The release loop relies on these invariants:

- `npm.publish` stays off because release-it's npm phase precedes git push. The
  `before:github:release` hook publishes only after the release commit and tag reach `origin/main`.
- `scripts/publish-release.mjs` is idempotent. It skips an existing exact version, treats only a 404
  as absent, and fails on every other registry lookup error.
- The deploy key can bypass the branch ruleset and its pushes start workflows, so the release commit
  carries `[skip ci]` to prevent a release loop.
- The workflow stays at `.github/workflows/release.yml`, the filename bound to npm trusted publishing.
- `whatBump` maps breaking notes to major, `feat` and `feature` to minor, and `fix`, `perf`, and
  `revert` to patch; other commit types do not release. Re-measure this ladder before changing it or
  upgrading its release-it plugin or preset.
- The configuration stays in `.release-it.js` because `whatBump` is a function and release-it merges
  this file with `package.json`.

After a partial release failure, run **Release** with **retry-current** in GitHub Actions. It targets
the existing tagged version, retains OIDC, and safely repeats the idempotent steps.

### Known upgrade constraint

- **TypeScript must not go to 7.** TypeScript 7 ships the Go compiler and exposes no stable
  programmatic API, so every tool that type-checks through one is stranded — ts-jest here,
  typescript-eslint and ts-morph elsewhere. `ts-jest` still declares `typescript@">=4.3 <7"`, and
  installing 7 fails with ERESOLVE rather than degrading quietly, so the whole test suite stops
  running. The blocker is TypeScript, not ts-jest: no ts-jest release can fix this before the API
  lands. Revisit when TypeScript 7.1 ships, not on ts-jest releases.
