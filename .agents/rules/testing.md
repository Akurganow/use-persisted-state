---
description: Testing rules - prove a test can fail, never enshrine a bug as the contract
trigger: always
tags:
  - testing
  - jest
  - quality
---

## Testing

Jest with ts-jest and React Testing Library in a jsdom environment. Storage is mocked with
`jest-localstorage-mock` and `jest-webextension-mock`.

### A test must be proven able to fail

Before a test counts as coverage, watch it go **red** against the broken or unfixed code, then green
after the fix. A test that passes both before and after the change tests nothing, and it is worse than
no test, because it manufactures confidence.

For a bug fix this is not optional: write the test, run it against the unfixed code, keep the failure
output, then fix. For a behaviour-preserving refactor the bar is different — there is no failure to
produce, so the standard is that the entire existing suite is green before and after, with no test
temporarily broken for ceremony.

### Never enshrine a bug as the contract

This repository already contains tests that assert the defect. Cases state that `null` "is not saved,
so the initial value stays" — while the real behaviour is that `null` **is** written to storage and
then fails to read back. The test locked the bug in and made it invisible to everyone after.

When behaviour looks wrong, fix the behaviour and the test. Never write an assertion whose only
justification is "this is what the code currently does".

### Test the real target

A suite that runs against the wrong branch, the wrong environment or a stale build proves nothing,
however green it is. SSR is the trap here: a test running under jsdom has `window` defined, so it can
never prove that importing a module works without a DOM. That has to run in a Node environment, or the
test is green by construction.

### Practice

- Drive hooks with `renderHook`; wrap state updates and async work in `act`.
- Assert observable behaviour, not internal state.
- Clean up between cases. Some adapters keep module-level registries, so state leaks across tests and
  one case can silently pass because another ran first.
- Cover both the sync and the async storage paths — they are separate implementations with separate
  failure modes.
- Verify that listeners are removed and effects cleaned up. Leaked subscriptions are a real failure
  mode for this library, not a hypothetical one.
