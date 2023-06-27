This is the starter page for the Commonwealth Code Style Guide. Here we document requirements for all code written for the Commonwealth App. This is an evolving document, and is expected to be authoritative if not exhaustively complete. 

- Code requirements this document *should* generally follow [[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)](https://www.rfc-editor.org/rfc/rfc2119).
- Unless otherwise noted, code styles in this guideline are for NodeJS & TypeScript.

## Baseline Language Requirements

- WRT TypeScript it is expected that engineers are already familiar with and follow the official [[TypeScript style guide](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines) which this document supplements.

## CW Specific Requirements

### On server: use relative imports, not absolute.

    Do this: `import foo from '../foobar';`

    Not this: `import foo from 'commonwealth/server/';`

### On client: only some absolute imports are valid.

    Do not prefix with:

- `commonwealth/`
- `client/` or `client/scripts/`
- `shared/`

    **********************************************Do not import `server/` on the client.**

## Commenting 
- Use comments to provide context and explain _why_ something is being done, not just 'what' is being done. This helps future developers understand the purpose and intent of the code.

- Use descriptive variable and function names to reduce the need for comments by making the code more self-explanatory.

- Place comments above the code they describe. 

- Use inline comments for explaining complex or non-obvious code, sparingly, and only when necessary.

- Use JSDoc comments to document functions, classes, and interfaces. This includes describing the purpose of the function or class, the parameters it takes, the return value (if any), and any exceptions it may throw. This will allow us to automatically generate codebase documentation. 

- Use consistent formatting for comments. We don't yet have a code commenting style guide for Commonwealth, so it's up to you to maintain consistency (until we get that.) 

- We also use Prettier library to format our codebase. t/k adding documentation for how Prettier runs in CICD and how to format/lint code locally. 

## Linting
### Commands
All linting commands should be run from root.
- `yarn lint`
    - Lints new code changes that have yet to be committed.
- `yarn lint-all`
    - Lints all code (regardless of changes)
- `yarn lint-branch`
    - Lints all changes made in a branch (used in CI). This is the command most people will want to use.
### Configuration
There is a single root `.eslintrc.js` file. All packages inherit from this config. Child configs in specific packages can modify/override the rules as well as the settings defined by the parent config.

Global rules we eventually want to turn back on:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/consistent-type-imports`

We will slowly remove rules turned off in the Commonwealth `.eslintrc.js`

## Formatting
We use Prettier for formatting our codebase. There is only 1 prettier config and it is `.prettierrc.json` at the root of the repo.
**Never run prettier from anywhere other than root to avoid conflicting prettier configs!**

### Commands
Formatting commands should **always** be executed from root.
- `yarn format`
    - execute prettier and format the entire repo
- `yarn format-check`
    - execute prettier in check mode which means it lists files that require formatting but doesn't actually format them


