module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  plugins: [
    "@typescript-eslint"
  ],
  parser: "@typescript-eslint/parser",
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
    "@typescript-eslint/no-unused-vars": ["warn", {"argsIgnorePattern": "^_"}],
    "no-restricted-imports": ["error", {
      patterns: [{
        group: [
          "@hicommonwealth/core/**",
          "@hicommonwealth/adapters/**",
          "@hicommonwealth/model/**",
          "@hicommonwealth/chains/**",
          "**/core/src/**",
          "**/adapters/src/**",
          "**/model/src/**",
          "**/chains/src/**",
        ],
        message: "Avoid importing from 'lib' directories. Import from the main entry point instead.",
      }]
    }]
  }
}