module.exports = {
  testEnvironment: 'node',
  watchman: false,
  modulePathIgnorePatterns: ['<rootDir>/.stryker-tmp/', '<rootDir>/dist/'],
  testMatch: ['**/tests/unit/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { module: 'commonjs', target: 'ES2022', ignoreDeprecations: '6.0' } },
    ],
  },
  collectCoverageFrom: ['src/engine/**/*.ts', 'src/storage/**/*.ts', 'src/policies/**/*.ts'],
  coverageThreshold: {
    global: { branches: 80, statements: 80, functions: 80, lines: 80 },
    './src/policies/': { branches: 90, statements: 90, functions: 90, lines: 90 },
    './src/engine/': { branches: 90, statements: 90, functions: 90, lines: 90 },
  },
};
