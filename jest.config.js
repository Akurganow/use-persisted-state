/**
 * @type {jest.ProjectConfig}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom-sixteen',
  roots: ['<rootDir>/__tests__'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  setupFilesAfterEnv: ['<rootDir>.jest/setup.ts'],
}
