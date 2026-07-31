---
applyTo: "__tests__/**/*.{ts,tsx}"
---

# Test-Specific Instructions

The testing rules live in [`AGENTS.md`](../../AGENTS.md) — in particular the
requirement that every test be proven able to fail before it counts as coverage.
What follows only adds detail specific to this suite.

## Mocking storage

- Never touch real browser storage. `jest-localstorage-mock` covers
  local/session storage, `jest-webextension-mock` covers extension storage.
- Cover both the sync and the async storage paths; they are separate hooks with
  separate failure modes.
- Clean up between tests (`cleanup()`, clear the storage) so state cannot leak
  across cases — several adapters share module-level registries.

## React Testing Library

- Drive hooks with `renderHook`, wrap state updates and async work in `act`.
- Assert on observable behaviour, not internal state.
- Verify that listeners are removed and effects are cleaned up — leaked
  subscriptions are a real failure mode for this library, not a hypothetical one.
