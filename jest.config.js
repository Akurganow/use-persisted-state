/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    'jest-localstorage-mock',
    'jest-webextension-mock',
    // Registered once here rather than imported per file, so a new component
    // test cannot silently lose its matchers by forgetting the import.
    '@testing-library/jest-dom',
  ],
  // Isolate storage mock call history without resetting their implementations.
  clearMocks: true,
  // Avoid duplicate discovery in agent worktrees and build output.
  roots: ['<rootDir>/__tests__'],
}
