<!-- Thank you for contributing! See CONTRIBUTING.md for setup and conventions. -->

## Summary

<!-- What does this change do, and why? Link the related issue if there is one, e.g. "Closes #123". -->

## Type of change

<!-- The Conventional Commits type determines the released version: fix -> patch, feat -> minor,
     BREAKING CHANGE -> major; chore/docs/test/refactor/build/ci -> no release. -->

- [ ] `fix` — bug fix (patch release)
- [ ] `feat` — new feature (minor release)
- [ ] Breaking change (major release; explained below)
- [ ] `docs` / `test` / `refactor` / `chore` / `build` / `ci` — no release

## Checklist

- [ ] The PR title follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format and the type matches the change
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes, with tests added or updated for behaviour changes
- [ ] `npm run build` passes
- [ ] Documentation (README, `docs/`) is updated if the public API or observable behaviour changed
- [ ] No new runtime dependencies, no manual edits to `lib/`, `CHANGELOG.md` or the package version
