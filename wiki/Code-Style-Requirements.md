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