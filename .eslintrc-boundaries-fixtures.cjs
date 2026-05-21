const path = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['boundaries'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  settings: {
    'boundaries/root-path': path.resolve(__dirname),
    'boundaries/include': [
      'packages/commonwealth/test/boundaries/fixtures/**/*.ts',
    ],
    'boundaries/elements': [
      {
        type: 'legacy-view',
        mode: 'full',
        pattern:
          'packages/commonwealth/test/boundaries/fixtures/legacy-view/**',
      },
      {
        type: 'legacy-core',
        mode: 'full',
        pattern:
          'packages/commonwealth/test/boundaries/fixtures/legacy-core/**',
      },
    ],
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      typescript: {
        project: ['./packages/commonwealth/tsconfig.json'],
      },
    },
  },
  rules: {
    'boundaries/element-types': [
      'error',
      {
        default: 'allow',
        rules: [
          {
            from: ['legacy-core'],
            disallow: ['legacy-view'],
            message:
              'Fixture contract: legacy-core must not depend on legacy-view.',
          },
        ],
      },
    ],
  },
};
