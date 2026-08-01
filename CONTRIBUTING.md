# Contributing to @plq/use-persisted-state

Thank you for considering a contribution! This document explains how to set up the project, run
the checks, and get a change merged.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting started

### Prerequisites

- **Node.js** — the version used for development is pinned in [`.node-version`](.node-version);
  version managers such as `fnm`, `nvm` or `asdf` pick it up automatically. The library itself
  supports Node >= 16.
- **npm** — the repository uses `package-lock.json`, so install with `npm ci`.

### Setup

```sh
git clone https://github.com/Akurganow/use-persisted-state.git
cd use-persisted-state
npm ci
```

## Project layout

| Path | Purpose |
| --- | --- |
| `src/index.ts` | Public entry point |
| `src/create-persisted-state.ts` | Synchronous hook factory |
| `src/create-async-persisted-state.ts` | Asynchronous hook factory |
| `src/storages/` | Bundled storage adapters |
| `src/utils/` | Internal helpers |
| `src/@types/` | Public type definitions |
| `__tests__/` | Jest test suite |
| `demo/` | Vite example app (not published) |
| `docs/` | Documentation, including the [storage API](docs/storage-api.md) and [packaging](docs/packaging.md) |
| `lib/` | Build output produced by `tsc` — never edit it by hand |
| `esm/`, `storages/` | Hand-written wrappers over `lib/` — see [packaging](docs/packaging.md) |
| `scripts/` | Package checks run by `npm run check:package` |

The supported API is the package root and the documented storage adapter entry points. Legacy
`./lib/*` and compatibility `./src/*` paths remain resolvable, so run the packaging checks before
changing their modules. Observable behaviour — what the hook returns, when it re-renders, what lands
in storage — affects consumers even when the type signature is untouched.

## Development commands

| Task | Command |
| --- | --- |
| Run tests | `npm test` |
| Run tests in watch mode | `npm run test:watch` |
| Type-check the tests | `npm run typecheck` |
| Lint (Biome) | `npm run lint` |
| Lint and apply safe fixes | `npm run lint:fix` |
| Format | `npm run format` |
| Build the library | `npm run build` |
| Build in watch mode | `npm run build:watch` |
| Check what would be published | `npm run check:package` (needs `npm run build` first) |
| Run the demo app | `npm run demo` |

## Testing

Tests live in `__tests__/` and run on Jest with `ts-jest` in a `jsdom` environment, using React
Testing Library. Browser storage is mocked with `jest-localstorage-mock` and
`jest-webextension-mock`.

Guidelines:

- Add or update tests for every behaviour change, and make sure each test can actually fail for
  the reason it claims to check.
- Cover both the synchronous and the asynchronous storage paths — they are separate
  implementations with separate failure modes.
- Drive hooks with `renderHook`; wrap state updates and async work in `act`.
- Clean up between cases: some adapters keep module-level listener registries, so state can leak
  across tests.

## Commit convention

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/),
and here that is load-bearing rather than cosmetic: the release tooling
(`release-it` with `@release-it/conventional-changelog`) derives the released version and the
changelog directly from commit messages. **A wrong type ships a wrong version to everyone who
installs the package.**

```
<type>: <summary in present tense, not capitalised, no trailing period>
```

| Type | Effect on the release |
| --- | --- |
| `fix:`, `perf:`, `revert:` | patch |
| `feat:` | minor |
| `BREAKING CHANGE:` in the body/footer | major |
| `chore:`, `docs:`, `test:`, `refactor:`, `build:`, `ci:` | no release |

Use the body to explain **why** the change was made. The diff already shows what changed.

## Proposing a change

1. **Open an issue first** for new features or behaviour changes, so the approach can be discussed
   before you invest time in an implementation. Small fixes can go straight to a pull request.
2. **Fork and branch.** Branch off `main` with a lowercase, descriptive name — for example,
   `fix-null-round-trip`, not `patch-2`.
3. **Make the change.** Keep pull requests focused on a single concern. Do not add runtime
   dependencies — the package deliberately has exactly one (`@plq/is`) and is chosen for being
   small. Do not edit `lib/` (build output) or `CHANGELOG.md` (generated on release), and do not
   bump the version in `package.json` — releases handle both.
4. **Verify locally:** `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` must all
   pass. CI runs those four on Linux, macOS and Windows for every pull request, and
   `npm run check:package` on the build output.
5. **Open the pull request** against `main` and fill in the template. Keep the title in the
   Conventional Commits format, since it determines the released version once merged.
6. **Update documentation** (README, `docs/`) when the public API or observable behaviour changes.

## Releases

Releases are cut automatically. Every push to `main` runs the GitHub Actions **Release** workflow,
which runs `release-it`: the version and changelog are derived from the conventional commit history.
It bumps the version in `package.json`, writes `CHANGELOG.md`, commits both back to `main`, tags
them, publishes to npm and opens a GitHub release. Merging a pull request is therefore what
publishes it, which is why the table above matters. Contributors never need to publish anything —
and should never edit the version or the changelog by hand, since the release owns both.

A push whose commits earn no version — dependency bumps, documentation, CI — finishes green having
done nothing, and its log reads `No new version to release`. The line above it renders a changelog
heading containing `null`, as in `## [null](compare/v1.0.0...vnull)`. That is the changelog plugin
formatting a heading before the run decides there is no version; nothing is written and nothing is
published. It is noise in the log, not a symptom.

The workflow can also be started by hand from the Actions tab to rehearse the release with
`--dry-run` or retry the currently tagged release after an outage.

## Reporting bugs and security issues

- Bugs and feature requests: use the [issue templates](https://github.com/Akurganow/use-persisted-state/issues/new/choose).
- Security vulnerabilities: **do not open a public issue** — see [SECURITY.md](SECURITY.md).
