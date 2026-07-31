/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['jest-localstorage-mock', 'jest-webextension-mock'],
  // The storage mocks are module-level and record every call, so a
  // `not.toHaveBeenCalled()` assertion only held while declaration order put it
  // first; under `--randomize` a sibling's writes leaked in. Clearing call
  // history before each test makes the assertion mean what it says. `resetMocks`
  // must stay off — it strips the mocks' implementations, which the
  // jest-localstorage-mock docs call out explicitly.
  clearMocks: true,
  // Tests live only here. Without this, jest also walks agent worktrees under
  // .claude/ and the built output, running the same suites twice.
  roots: ['<rootDir>/__tests__'],
}
