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

### A test that cannot fail is worthless

A test which stays green whether the behaviour works or not proves nothing, and is worse than no test
because it manufactures confidence. Every test should be capable of failing for the reason it claims
to check.

How far to go proving that is a judgement call, made per case rather than by ritual:

- **Watch it go red first** when the failure is the point — a reported bug, a subtle condition, a
  regression you are locking down. Seeing the exact failure is what proves the test aims at the real
  defect and not next to it.
- **Skip the ceremony** when the test plainly cannot pass by construction, or when the change is
  mechanical and the assertion is obvious.
- **Reach for a mutation audit** when false green is genuinely plausible — wide tolerances, assertions
  that echo their own input, suites that might be running against the wrong branch, environment or
  build. Break the code deliberately, confirm the test notices. Prefer someone other than the author
  to run it.
- **A behaviour-preserving refactor has no red phase at all.** The bar is the whole existing suite
  green before and after, with nothing broken for ceremony.

Judge which of these a change actually needs. Applying all of them to everything is as wrong as
applying none.

### Never enshrine a bug as the contract

This repository carried exactly that for a long time. Cases stated that `null` "is not saved, so the
initial value stays", when the real behaviour was that `null` **was** written to storage and then
failed to read back. The test locked the bug in and made it invisible to everyone after; the cases in
`__tests__/data-types.test.tsx` now assert the round trip instead.

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
