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
a tarball and resolves every published specifier through both module systems, then checks the
wrapper declarations, `publint` and `attw`; see [packaging](../../docs/packaging.md).

### Versioning

Public API changes follow semver. A behaviour change that users can observe — what the hook returns,
when it re-renders, what lands in storage — is breaking even when the type signature is untouched.

Releases are cut automatically from every push to `main`, so merging a pull request is what publishes.
The version comes from the commit messages alone: only `feat`, `fix`, `perf`, `revert` and a declared
breaking change earn one, and a push carrying nothing else ends in "No new version to release" and a
green run, so dependency updates cost a no-op rather than a version.

A release that does happen runs `release-it`, which bumps the version in `package.json`, writes
`CHANGELOG.md`, commits both, tags the commit, pushes the branch and the tag back to `main`,
publishes to npm over OIDC, and creates the GitHub release. Nobody touches the version or the
changelog by hand; the only human action is merging.

Three things about that loop are load-bearing and break silently if they are "tidied":

- **Nothing is published until the push has succeeded.** release-it publishes in its npm phase,
  which runs *before* the commit, tag and push, so `npm.publish` is off and the publish happens
  from a `before:github:release` hook instead. The asymmetry is the reason: a published version can
  never be replaced, so publishing before a push that then fails strands a version nobody can reuse
  and wedges every later run on `EPUBLISHCONFLICT`, while a tag that was pushed without a publish
  is just deleted and retried.
- **The publish step is idempotent, and only a 404 counts as "not published".**
  `scripts/publish-release.mjs` skips the publish when that exact version is already on the
  registry, which is what lets a failed run be retried. Any other lookup failure — an unreachable
  registry first among them — fails the release rather than skipping, because a skip would report
  a green release for a package that never shipped.
- **The release commit carries `[skip ci]`.** It is pushed with a deploy key, not `GITHUB_TOKEN`,
  and a deploy key push *does* start workflows, so without the marker the release commit would
  trigger the release that produced it. The deploy key exists because the branch ruleset can grant
  a bypass to that actor and cannot grant one to the built-in `github-actions[bot]`.
- **The workflow file must stay `.github/workflows/release.yml`.** The npm trusted publisher is
  bound to that filename; renaming the file stops OIDC publishing.

When a release dies part-way — the tag is pushed but the GitHub release is missing, say — starting
an ordinary run does not finish it: the tag is already the newest, no commits follow it, and the
run ends in "No new version to release" having done nothing. Recover by starting **Release** from
the Actions tab with **retry-current** ticked, which targets the tagged version instead of deriving
a new one. It has to run there rather than locally, because OIDC publishing only exists inside a
workflow. Whatever already succeeded is skipped, so the retry is safe to repeat.

That policy is stated by the `whatBump` in `.release-it.js` rather than inherited from the preset,
because the preset's own answer has already flipped once under this repository. In
`conventional-changelog-conventionalcommits@8` it opened with `level = 2` — a patch floor, which
resolved even a history with no commits at all to a patch, and under a push trigger would have
published a version for every dependency bump. In `10.2.1`, which is what the lock resolves now, it
opens with `level = null` and returns no release instead. A push trigger is only safe under the
second, and which of the two applies is decided by a transitive dependency. Stating the policy here
takes that decision back.

Measured with `release-it --dry-run --ci` over synthetic histories, both with the local `whatBump`
and with it removed: nothing, chore-only, and `chore + docs + ci + refactor + test + build` release
nothing; `chore + fix` gives a patch, `chore + fix + feat` a minor, `perf` alone a patch, `revert`
alone a patch, and a `BREAKING CHANGE` footer a major whichever type carries it.
Re-measure that ladder before changing `whatBump`, and before accepting an upgrade to
`@release-it/conventional-changelog` or to the preset beneath it — the bump ladder decides what gets
published, and it is not owned by this repository alone.

The whole release-it configuration lives in `.release-it.js` rather than in `package.json`, because
`whatBump` is a function. release-it merges both sources, so a configuration split across them would
exist twice.

### Known upgrade constraint

- **TypeScript must not go to 7.** TypeScript 7 ships the Go compiler and exposes no stable
  programmatic API, so every tool that type-checks through one is stranded — ts-jest here,
  typescript-eslint and ts-morph elsewhere. `ts-jest` still declares `typescript@">=4.3 <7"`, and
  installing 7 fails with ERESOLVE rather than degrading quietly, so the whole test suite stops
  running. The blocker is TypeScript, not ts-jest: no ts-jest release can fix this before the API
  lands. Revisit when TypeScript 7.1 ships, not on ts-jest releases.
