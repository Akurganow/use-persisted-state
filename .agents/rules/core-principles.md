---
description: How to work in this repository - research first, no patches, agree before implementing
trigger: always
tags:
  - principles
  - guidelines
  - workflow
---

## Core Principles

1. **Find the root cause; never work around it.** A change that hides a symptom leaves the defect in
   place and buys nothing.

2. **Research before changing.** When something breaks, an upgrade fails, or an API is unfamiliar,
   read the official documentation, the changelog and the upstream issue tracker *first*, then decide.
   Do not fix by trial and error — installing something to see what breaks produces confident wrong
   conclusions.

3. **No patches.** Dependency `overrides`, `--legacy-peer-deps`, and flags that silence a check are
   forbidden. They outlive the problem they hide and quietly become permanent. If an upgrade does not
   resolve cleanly, the correct outcome is to stay on the current version and say why, citing the
   source.

4. **Agree before implementing.** Decisions that shape the project — replacing a tool, changing the
   build, restructuring files, adding or dropping a dependency — are proposed and agreed first.
   Announcing a decision that is already implemented is not agreement.

5. **Never commit or push without explicit permission.** Committing, pushing, opening a pull request
   and releasing each need their own instruction, every time. Permission for one is never permission
   for the next.

6. **Never destroy work that is not yours.** `git checkout --`, `git restore`, `git reset --hard`,
   `git clean`, `git stash drop` and force pushes are off limits unless the specific file or command
   is named. Uncommitted work cannot be recovered.

7. **Follow what the project already does.** Match existing structure, naming and error handling
   before introducing a new pattern, and prefer extending something that exists over adding a second
   way to do the same thing.

8. **Be honest about what was actually verified.** Report the command that ran and what it printed.
   Never claim a gate passed, a bug is fixed, or a fact is confirmed without having seen it. When
   something is incomplete or uncertain, say so plainly instead of rounding up.
