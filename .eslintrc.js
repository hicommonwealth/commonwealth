module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "prettier"
  ],
  plugins: [
    "@typescript-eslint"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    "tsconfigRootDir": __dirname,
    project: ["./packages/**/tsconfig.json"]
  },
  root: true,
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    }
  },
  "import/resolver": {
    node: {},
    webpack: {
      config: "webpack/webpack.common.js"
    },
    typescript: {
      project: [
        "./packages/**/tsconfig.json"
      ]
    }
  },
  rules: {

  }
}
