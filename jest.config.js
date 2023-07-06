/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/*.d.ts',
    '!**/config.ts',
    '!**/types.ts',
    '!src/tests/**',
    '!**/__mocks__/**',
    '!**/__stories__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  globalSetup: './src/jest/globalJestSetup.ts',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)', '!**/__tests__/resources/*.ts'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};
