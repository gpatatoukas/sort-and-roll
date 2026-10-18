const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'reports/**',
      '.stryker-tmp/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  {
    files: ['src/engine/**/*.ts', 'src/policies/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react-native',
            'expo*',
            '@/features/*',
            '@/storage/*',
            '@/services/*',
            '../storage/*',
            '../services/*',
          ],
        },
      ],
    },
  },
]);
