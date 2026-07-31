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
backend. Everything under `src/` is public API that other projects depend on, so a careless change to
a signature or to observable behaviour breaks strangers' builds.

- **Runtime dependencies: `@plq/is` only.** Keep it that way — this package is chosen for being small.
- **Peer:** React >= 16.8 (hooks), supports 18 and 19.
- **Entry point** is `src/index.ts`. Storage adapters live in `src/storages/`, internals in
  `src/utils/`, public types in `src/@types/`.
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

### Upgrades known to be blocked

- **TypeScript must not go to 7.** TypeScript 7 ships the Go compiler and removes the JS compiler API
  that ts-jest is built on, so the whole test suite stops running. Blocked until ts-jest supports it.

Keep the reason written next to any pin. A pin without a stated reason gets "helpfully" removed by
whoever touches dependencies next.
