---
description: DRY, SOLID, clean code and clean architecture rules, with worked examples from this codebase
trigger: always
tags:
  - design
  - architecture
  - solid
  - dry
---

## Code Design Best Practices

These are requirements, not aspirations. A change that violates one of them is not finished, however
well it works.

### DRY

**Never duplicate logic.** Two copies drift apart, and the second one is the one nobody updates. When
the same behaviour is needed twice, extract it — and when you find yourself copying a file to adapt
it, that is the moment to factor out the shared part instead.

The two extension adapters show the shape this takes. `src/storages/chrome-storage.ts` and
`src/storages/browser-storage.ts` were near-identical copies; what they shared — the listener
registry, the change conversion, the value normalization — now lives in
`src/utils/extension-storage.ts`, and each adapter keeps only the calls its own extension API needs.
A third backend extends that module rather than copying an adapter.

DRY is about knowledge, not characters. Two pieces of code that look alike but answer to different
reasons for change should stay apart; merging them couples things that must move independently.

### SOLID

- **Single responsibility.** A module has one reason to change. A file that both talks to a storage
  backend and decides React state has two.
- **Open/closed.** New behaviour arrives as a new adapter implementing `Storage` or `AsyncStorage`,
  not as another branch inside the hook. If supporting a backend requires editing the core, the
  abstraction is wrong.
- **Liskov substitution.** Every adapter must be usable wherever the interface is expected, with no
  surprises. An adapter that silently drops values, or whose `get` returns something the contract does
  not allow, breaks callers that were written against the interface.
- **Interface segregation.** Keep `Storage` and `AsyncStorage` minimal. Do not add a method to the
  public interface because one adapter finds it convenient — every implementer then has to provide it.
- **Dependency inversion.** The hook depends on the `Storage` abstraction, never on a concrete
  backend. This is the load-bearing design decision of the library: `createPersistedState` accepts any
  adapter, which is why consumers can supply their own. Never import `localStorage` or `chrome.storage`
  into core logic.

### Clean architecture

Dependencies point inward. The core — the hooks and their helpers — knows nothing about which backend
it serves; concrete knowledge lives at the edges, in `src/storages/`. Anything specific to a backend
(chrome storing arbitrary JSON, web storage holding only strings) is normalized **in the adapter**, so
the core sees one uniform contract.

Never leak a backend's quirks inward, and never widen a core type to accommodate one adapter.

### Clean code

- Functions do one thing and are small enough to read at once.
- No surprises: a function named as a query does not mutate anything. **A predicate must have no side
  effects.** `isAsyncStorage` is the worked example: it once detected async support by *calling*
  `get('')`, `set({})` and `remove('')`, so merely asking a question wrote to the user's storage. It
  now answers from the declared members wherever it can, never invokes `set` or `remove`, and falls
  back to a single `get('')` — the one probe that leaves the inspected storage as it found it.
- Prefer clear names over comments; when a comment is needed, it explains why.
- No flag parameters that make a function do two different things.
- Fail loudly and early rather than continuing with a broken value.
