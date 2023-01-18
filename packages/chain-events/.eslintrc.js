const path = require('path');

module.exports = {
  "extends": [
    path.resolve(__dirname, "../../.eslintrc.js")
  ],
  "ignorePatterns": ["contractTypes", "eth", "dist", "migrations"],
  "rules": {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/no-empty-function": "off",
    "max-classes-per-file": "off",
    "no-await-in-loop": "off",
    "no-import-cycles": "off",
    "no-nested-ternary": "off",
    "no-param-reassign": "off",
    "no-plusplus": "off",
    "no-restricted-syntax": "off",
    "no-underscore-dangle": "off",
    "no-useless-constructor": "off",
    "class-methods-use-this": "off",
    // "import/no-extraneous-dependencies": "off",
    // "import/prefer-default-export": 0,
    // "import/extensions": 0,
    // "import/no-cycle": 0,
    // "import/order": [
    //   "error",
    //   {
    //     "newlines-between": "always"
    //   }
    // ],
  }
}
