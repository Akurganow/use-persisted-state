---
description: Conventional commits drive the released version; each git action needs its own permission
trigger: always
tags:
  - git
  - commits
  - releases
---

## Git Workflow

### Commits

Commit messages follow Conventional Commits, and here that is load-bearing rather than cosmetic:
`@release-it/conventional-changelog` derives the released version and the changelog directly from
them. A wrong type ships a wrong version to everyone who installs the package.

```
<type>: <summary in present tense, not capitalised, no trailing period>
```

| Type | Effect on the release |
| --- | --- |
| `fix:` | patch |
| `feat:` | minor |
| `BREAKING CHANGE:` in the body | major |
| `chore:`, `docs:`, `test:`, `refactor:`, `build:`, `ci:` | no release |

Use the body to explain **why** the change was made and what it costs. The diff already shows what
changed; it cannot show what you rejected and why.

### Branches

Work on a branch, never directly on `main`. Names are lowercase and descriptive of the change —
`fix-null-round-trip`, not `fix-1` or `patch-2`.

### Permission is per action

Committing, pushing, opening a pull request and releasing are four separate actions, and each one
needs its own explicit instruction, every time. Being told to commit is not permission to push. Being
told to push is not permission to open a pull request. Being asked to prepare a release is not
permission to publish one.

When in doubt, stop and ask. An unwanted local commit costs a moment; an unwanted push or publish is
visible to everyone and cannot be quietly undone.
