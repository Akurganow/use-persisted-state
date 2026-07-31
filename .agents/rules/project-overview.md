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
| Lint | `npm run lint` |
| Build | `npm run build` |
| Demo dev server | `npm run demo` |

### Versioning

Public API changes follow semver. A behaviour change that users can observe — what the hook returns,
when it re-renders, what lands in storage — is breaking even when the type signature is untouched.

### Upgrades known to be blocked

- **TypeScript must not go to 7.** TypeScript 7 ships the Go compiler and removes the JS compiler API
  that ts-jest is built on, so the whole test suite stops running. Blocked until ts-jest supports it.

Keep the reason written next to any pin. A pin without a stated reason gets "helpfully" removed by
whoever touches dependencies next.
