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
    "@typescript-eslint/no-explicit-any": "off",
    "import/namespace": "off",
    "import/default": "off"
  }
}
