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

### Prove sensitivity

Every new or changed test must have concrete evidence that it fails when its protected behaviour is
broken. Record one of these against the real target branch, environment, and build:

- **RED before GREEN:** run the test on the actual faulty state and capture the expected failure.
- **Mutation:** introduce the specific fault the test should catch and capture the failure.

Name the defect or mutation each regression test detects. A green run on corrected code alone is not
evidence. A different auditor must verify the sensitivity; the test author cannot approve their own
test. If no tests change during a behaviour-preserving refactor, compare the existing suite before
and after instead of inventing test churn.

### Never enshrine a bug as the contract

Assert the intended public contract, not merely the current implementation. When behaviour is wrong,
fix both the behaviour and any test that enshrines it.

### Test the real target

A suite run against the wrong branch, environment, or build proves nothing. In particular, jsdom has
`window`, so SSR import coverage must run in a Node environment.

### Practice

- Drive hooks with `renderHook`; wrap state updates and async work in `act`.
- Assert observable behaviour, not internal state.
- Clean up between cases. Some adapters keep module-level registries, so state leaks across tests and
  one case can silently pass because another ran first.
- Cover both the sync and the async storage paths — they are separate implementations with separate
  failure modes.
- Verify that listeners are removed and effects cleaned up. Leaked subscriptions are a real failure
  mode for this library, not a hypothetical one.
