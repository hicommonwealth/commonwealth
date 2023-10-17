This is the starter page for the Commonwealth Code Style Guide. Here we document requirements for all code written for the Commonwealth App. 

Unless otherwise noted, code styles in this guideline are for NodeJS & TypeScript. It is expected that engineers are already familiar with and follow the official [[TypeScript style guide](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines) which this document supplements. For a list of React-specific guidelines, see [React Best Practices](./React-Best-Practices-And-Improvements.md).

## Imports

On server, use relative imports, not absolute: `import foo from '../foobar';`

On client, only some absolute imports are valid. Do not prefix with:
- `commonwealth/`
- `client/` or `client/scripts/`
- `shared/`

Never import `server/` on the client.

## Inline comments

- Place comments above the code they describe.
- Use inline comments for explaining complex or non-obvious code, sparingly, and only when necessary.
- Use comments to provide context and explain _why_ something is being done, not just 'what' is being done. This helps future developers understand the purpose and intent of the code.
- Use descriptive variable and function names to reduce the need for comments by making the code more self-explanatory.
- Use JSDoc comments to document functions, classes, and interfaces. This includes describing the purpose of the function or class, the parameters it takes, the return value (if any), and any exceptions it may throw. This will allow us to automatically generate codebase documentation. 
- Use consistent formatting for comments. We don't yet have a code commenting style guide for Commonwealth, so it's up to you to maintain consistency (until we get that.) 