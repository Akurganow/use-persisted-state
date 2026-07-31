# Security Policy

## Supported versions

Only the latest release of `@plq/use-persisted-state` receives security fixes.

| Version | Supported |
| --- | --- |
| latest 1.x | Yes |
| older releases | No |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report them privately by email to **a.kurganow@gmail.com**. Include as much of the following as you
can:

- A description of the vulnerability and its impact.
- Steps to reproduce, ideally with a minimal code sample.
- The affected version(s) and environment.

Reports are acknowledged as soon as they are seen. Please allow time for the issue to be
investigated and fixed before any public disclosure; you will be credited in the fix release
unless you prefer otherwise.

## Security considerations for users

This library persists React state to a storage backend (`localStorage`, `sessionStorage`,
extension storage, or a custom adapter) as plain, unencrypted JSON strings:

- **Do not persist secrets** — tokens, passwords, personal data — through this hook. Anything
  stored is readable by any code running on the same origin (or extension context).
- Stored values are parsed with `JSON.parse` when read back. Data in storage can be modified by
  other code on the page, so treat restored state as untrusted input and validate it in your
  application when that matters.
