module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'n'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: `./tsconfig.build.json`,
  },

  // indicates this is the parent eslint so eslint will stop searching further up for eslint configs
  root: true,
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {},
      typescript: {
        project: ['./tsconfig.json'],
      },
    },
  },
  rules: {
    // this rule has not been updated to ESLint 8 so it is incompatible with our ESLint setup
    // Error: Rules with suggestions must set the `meta.hasSuggestions` property to `true`. `meta.docs.suggestion` is ignored by ESLint.
    // '@typescript-eslint/no-explicit-any': 'off',
    // '@typescript-eslint/no-namespace': 'off',
    // '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // 'n/no-process-exit': 'error',

    // 08/2024 - disabling these for now since they're more stylistic
    '@typescript-eslint/no-explicit-any': 'off',
    'prefer-const': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-namespace': 'off',
    'no-extra-boolean-cast': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-prototype-builtins': 'off',
    '@typescript-eslint/ban-types': 'off',
    'no-var': 'off',

    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
  },
};
