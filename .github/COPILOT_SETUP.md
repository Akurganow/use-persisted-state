# GitHub Copilot Setup Instructions

This repository now includes GitHub Copilot configuration files. To complete the setup, some manual configuration is required in the repository settings.

## Files Added

### 1. `.github/copilot-instructions.md`
- **Purpose**: Provides project context to GitHub Copilot across Chat and code review
- **Contains**: Tech stack info, project layout, build commands, coding conventions, React compatibility details
- **Applies to**: All Copilot interactions in this repository

### 2. `.github/instructions/tests.instructions.md`
- **Purpose**: Specific guidance for test files
- **Target**: Files matching `__tests__/**/*.ts` pattern
- **Contains**: Jest standards, mocking guidelines, assertion practices

### 3. `.github/workflows/copilot-setup-steps.yml`
- **Purpose**: Prepares environment for Copilot coding agent
- **Key requirement**: Job must be named exactly `copilot-setup-steps`
- **Actions**: Installs Node.js, caches npm, installs dependencies, runs build and tests

## Required Manual Configuration

### Enable Copilot Code Review

1. Navigate to **Settings** → **Copilot** → **Code review**
2. **Enable custom instructions** to use the `.github/copilot-instructions.md` file
3. Add **Coding guidelines** in the settings page. Suggested guidelines:

```
**Public API Stability**: Avoid breaking changes without major version bumps. Keep types explicit and maintain backward compatibility.

**Testing Standards**: All behavior changes must include tests. Use mocked storage in unit tests, avoid real browser storage dependencies.

**TypeScript Quality**: Use proper generics for type safety, export types from main index, maintain React 16.8+ compatibility.

**Documentation**: Update README and examples when API changes. Keep CHANGELOG current with conventional commits.
```

### Optional: Automatic Code Review

1. Go to **Settings** → **Rules** → **Rulesets**
2. Create a new ruleset for pull requests
3. Add **Copilot code review** as a required check
4. This will automatically trigger Copilot reviews on all PRs

### Optional: PR Summaries

PR summaries are available with paid GitHub Copilot plans. They will automatically appear on pull requests once enabled in your organization settings.

## Environment Secrets (If Needed)

If your project requires private registry access or other secrets for the Copilot coding agent:

1. Go to **Settings** → **Environments**
2. Create an environment named `copilot`
3. Add required secrets/variables

## Verification

- Custom instructions will be active immediately after enabling in settings
- The setup workflow can be triggered manually via **Actions** → **Copilot Setup Steps** → **Run workflow**
- Copilot code review will appear on new pull requests after enabling

## Benefits

- **Context-aware suggestions**: Copilot understands your TypeScript/React patterns, testing standards, and project conventions
- **Faster onboarding**: New contributors get consistent guidance aligned with project standards
- **Code review assistance**: Automated suggestions for common issues like missing tests, API stability concerns
- **Agent efficiency**: Pre-configured environment reduces setup time for Copilot coding tasks