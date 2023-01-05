module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  plugins: [
    "@typescript-eslint"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    "tsconfigRootDir": __dirname,
    project: ["./packages/*/tsconfig.json"]
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
          "./packages/*/tsconfig.json"
        ]
      }
    },
  },
  rules: {
    "import/named": "off"
  }
}
