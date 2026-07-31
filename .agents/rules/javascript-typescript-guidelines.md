---
description: TypeScript types, naming and comment conventions for source, tests and demo
trigger: always
tags:
  - typescript
  - naming
  - style
---

## JavaScript and TypeScript Guidelines

### Types

- Keep the public surface explicit. Exported functions state their parameter and return types instead
  of relying on inference, so a change to the contract shows up in the diff.
- Avoid `any`. Prefer `unknown` plus a narrowing check at the boundary where untyped data enters —
  values coming out of a storage backend are the usual case, and they genuinely are unknown until
  checked.
- Never widen a public type to make an internal problem go away. Narrow at the adapter instead: the
  library writes serialized strings, even where a backend's own types allow arbitrary JSON.

### Naming

- Name by role, not by type. No Hungarian notation, no type encoded in the name.
- `camelCase` for variables, functions, methods and properties; `PascalCase` for types, interfaces and
  components; `CONSTANT_CASE` only for module-level constants.
- Booleans read as predicates: `is`, `has`, `should`, `can`.
- **A `use` prefix means the function is a real React hook** — one that calls other hooks. Never put it
  on a plain helper or factory. It misleads readers and lint rules alike, and this repository has
  already carried a `use`-prefixed factory called from inside an effect while the actual hook was
  anonymous.
- File names are kebab-case and match what they export.

### Comments

- Explain **why**, never restate **what** the code already shows. If code needs a comment to be
  understood, fix the naming or the structure instead.
- Worth recording: an invariant, a trade-off, the reason a value is narrowed, the bug a guard prevents.
- Forbidden: commented-out code, changelog or authorship notes, banner separators, and comments that
  no longer match the code beside them.
- Document exports with TSDoc, without repeating what the type signature already says.
