---
description: Code quality rules - no dead code, no swallowed errors, no speculative code
trigger: always
tags:
  - code
  - quality
  - rules
---

## Code Quality

1. **Delete dead code.** No commented-out blocks kept "just in case", no unreachable branches. Version
   control already remembers them, and a reader cannot tell a safety net from an oversight.

2. **One implementation per behaviour.** When a new path replaces an old one, the old one goes in the
   same change. Two paths mean two sets of bugs and no source of truth.

3. **Never swallow errors.** Do not catch an exception only to ignore it — a silent catch turns a bug
   into a mystery days later. Where a failure is genuinely expected, such as a stored value that will
   not parse, handle it deliberately and leave the reason in a comment.

4. **Finish migrations.** Moving from A to B means B works and A is gone, in one change. A half
   migration forces every future reader to hold both models in their head.

5. **No speculative code.** No parameter, option or abstraction added because it "might be needed".
   Add it when a caller actually needs it.

6. **Mind what a change costs at runtime.** This hook runs on every render of every consuming
   component. Synchronous storage reads, `JSON.parse` calls and subscription churn sitting in a render
   path are expensive here in a way they would not be in a one-off script.
