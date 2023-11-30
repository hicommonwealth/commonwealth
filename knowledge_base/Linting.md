# Linting

## Contents

- [Commands](#commands)
- [Configuration](#configuration)
- [Formatting](#formatting)
- [Formatting Commands](#formatting-commands)
- [Change Log](#change-log)

## Commands

All linting commands should be run from root.

- `yarn lint`
  - Lints new code changes that have yet to be committed.
- `yarn lint-all`
  - Lints all code (regardless of changes)
- `yarn lint-branch`
  - Lints all changes made in a branch (used in CI). This is the command most people will want to use.

## Configuration

There is a single root `.eslintrc.js` file. All packages inherit from this config. Child configs in specific packages can modify/override the rules as well as the settings defined by the parent config.

Global rules we eventually want to turn back on:

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/consistent-type-imports`

We will slowly remove rules turned off in the Commonwealth `.eslintrc.js`

## Formatting

We use Prettier for formatting our codebase. There is only 1 prettier config and it is `.prettierrc.json` at the root of the repo.

**Never run prettier from anywhere other than root to avoid conflicting prettier configs!**

### Formatting Commands

Formatting commands should **always** be executed from root.

- `yarn format`
  - execute prettier and format the entire repo
- `yarn format-check`
  - execute prettier in check mode which means it lists files that require formatting but doesn't actually format them

## Change Log

- 231012: Flagged by Graham Johnson for review. Recommendations out of date; greater clarity and context desirable.
- 230830: Split off by Graham Johnson from [Code-Style](./Code-Style.md) entry.
