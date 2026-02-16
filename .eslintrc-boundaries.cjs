const path = require('path');

const ENABLE_ESLINT_DIFF_PLUGIN =
  process.env.ENABLE_ESLINT_DIFF_PLUGIN || 'true';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'boundaries'],
  parserOptions: {
    project: [
      './tsconfig.json',
      './tsconfig.vite.json',
      './libs/**/tsconfig.json',
      './packages/tsconfig.json',
      './packages/commonwealth/tsconfig.json',
      './packages/load-testing/tsconfig.json',
    ],
    suppressDeprecatedPropertyWarnings: true,
  },
  settings: {
    'boundaries/root-path': path.resolve(__dirname),
    'boundaries/include': [
      'packages/commonwealth/client/scripts/**/*.{ts,tsx}',
    ],
    'boundaries/elements': [
      {
        type: 'legacy-view',
        mode: 'full',
        pattern: 'packages/commonwealth/client/scripts/views/**',
      },
      {
        type: 'legacy-core',
        mode: 'full',
        pattern:
          'packages/commonwealth/client/scripts/{controllers,helpers,hooks,lib,models,state,stores,utils}/**',
      },
      {
        type: 'app-shell',
        mode: 'full',
        pattern:
          'packages/commonwealth/client/scripts/{App.tsx,index.tsx,navigation/**}',
      },
    ],
    'import/resolver': {
      node: {},
      typescript: {
        project: ['./packages/commonwealth/tsconfig.json'],
      },
    },
  },
  rules: {
    'boundaries/element-types': [
      'warn',
      {
        default: 'allow',
        rules: [
          {
            from: ['legacy-core'],
            disallow: ['legacy-view'],
            message:
              'Legacy core modules must not import from views. Move shared contracts/types to shared/core locations.',
          },
        ],
      },
    ],
  },
  extends: [
    ENABLE_ESLINT_DIFF_PLUGIN !== 'false' ? 'plugin:diff/diff' : null,
  ].filter((current) => current !== null),
};
