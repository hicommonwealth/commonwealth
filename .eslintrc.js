module.exports = {
  extends: [
    "eslint:recommended",
    // re-enable later -> currently bugged when paired with webpack
    // "plugin:import/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  plugins: [
    "@typescript-eslint"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    "tsconfigRootDir": __dirname,
    project: ["./packages/*/tsconfig.json", "./packages/*/tsconfig.test.json"]
  },
  // indicates this is the parent eslint so eslint will stop searching further up for eslint configs
  root: true,
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    },
    "import/resolver": {
      node: {},
      typescript: {
        project: [
          "./tsconfig.json",
          "./packages/*/tsconfig.json",
          "./packages/*/tsconfig.test.json"
        ]
      }
    },
  },
  rules: {
    // this rule has not been updated to ESLint 8 so it is incompatible with our ESLint setup
    // Error: Rules with suggestions must set the `meta.hasSuggestions` property to `true`. `meta.docs.suggestion` is ignored by ESLint.
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-namespace": "off",
    '@typescript-eslint/consistent-type-imports': 'error'
  }
}
