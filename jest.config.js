/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['jest-localstorage-mock', 'jest-webextension-mock'],
  // Tests live only here. Without this, jest also walks agent worktrees under
  // .claude/ and the built output, running the same suites twice.
  roots: ['<rootDir>/__tests__'],
}
