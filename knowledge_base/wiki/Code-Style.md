This is the starter page for the Commonwealth Code Style Guide. 

Unless otherwise noted, code styles in this guideline are for NodeJS & TypeScript. It is expected that engineers are already familiar with and follow the official [[TypeScript style guide](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines) which this document supplements. 

For a list of React-specific guidelines, see [React Best Practices](./React-Best-Practices-And-Improvements.md).

**Contents**
- [Imports](#imports)
- [Inline Documentation](#inline-documentation)
  + [TSDoc](#tsdoc)
  + [Inline Comments](#inline-comments)

# Imports

On server, use relative imports, not absolute: `import foo from '../foobar';`

On client, only some absolute imports are valid. Do not prefix with:
- `commonwealth/`
- `client/` or `client/scripts/`
- `shared/`

Never import `server/` on the client.

# Inline documentation

Inline documentation should be reserved for code that is complex or non-obvious. 

Descriptive const names are our first line of defense.

## TSDoc

TSDoc syntax is preferred over inline comments when documenting a newly declared function, class, or interface. 

TSDoc syntax is especially preferred for code that is either exported or frequently re-invoked, so as to populate built-in IDE preview features.

The TSDoc annotation format is as follows:
```
/**
 * A description of the function
 * 
 * @param { type } paramName - Param description.
 * @param { type } secondParamName - Second param description.
 * @returns { type } A description of the return value.
 */
```

Thus, an example function might be documented as follows:
```
/**
  * get current details of a proposal
  * @param proposalId
  * @param govType type of governor. 'compound' || 'aave
  * @returns JSON data of proposal
  */

public async getProposalDetails(proposalId: string, govType = 'compound') {
  const request: govCompProposalId = { proposalId };
  const response = await axios.post(
    `${this.host}/gov/${govType}/proposalDetails`,
    JSON.stringify(request),
    this.header
  );
  return response.data;
}
```

A complete list of TSDoc tags can be found at [TSDoc.org](https://tsdoc.org/pages/tags/alpha/). Most functions, however, only require:

- @param: Used to document a function parameter.
- @returns:Used to document a function’s return value.

Additionally, we are moving towards use of the @deprecated to mark deprecated code.

## Inline comments

In cases where TSDoc is inappropriate for inline documentation, the following style guidelines should be observed instead:

- Place comments above the code they describe.
- Use comments to provide context and explain _why_ something is being done, not just 'what' is being done. This helps future developers understand the purpose and intent of the code.
- Use descriptive variable and function names to reduce the need for comments by making the code more self-explanatory.
- Datestamps, when used, should be formatted YYMMDD.

# Change Log

- 231010: Updated with TSDoc guidelines by Graham Johnson.
- 231010: Renamed from `Code-Requirements.md` to `Code-Style.md`.