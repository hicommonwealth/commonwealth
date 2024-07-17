# Code Style

This is the starter page for the Commonwealth Code Style Guide. As of 231109, it is considered under development and far from comprehensive!

Unless otherwise noted, code styles in this guideline are for NodeJS & TypeScript. It is expected that engineers are already familiar with and follow the official [TypeScript style guide](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines).

For a list of PENG-specific guidelines, see [React Best Practices](./React-Best-Practices.md).

For a list of platform-specific guidelines, see [Platform Coding Guidelines](./Platform-Coding-Guidelines.md).

## Contents

- [Inline Documentation](#inline-documentation)
  + [TSDoc](#tsdoc)
  + [Inline Comments](#inline-comments)
- [Error Handling](#error-handling)
  + [Backend Errors](#backend-errors)
- [Change Log](#change-log)

## Inline documentation

Inline documentation should be reserved for code that is complex or non-obvious.

Descriptive const names should be the first line of defense in producing human-readable code.

### TSDoc

TSDoc syntax is preferred over inline comments when documenting newly declared functions, including class functions.

TSDoc syntax is especially preferred in the following cases:

1. Code where clear naming and descriptive typing still leave ambiguity of intent.
2. Code that is exported or else frequently re-invoked, so as to populate built-in IDE preview features.
3. Code we plan to expose to external developers (e.g. in our API),where we may wish to autogenerate external-facing HTML documents describing how to use our interface.

As with all inline documentation, TSDoc annotations should be used sparingly, for complex or non-obvious code. By extension, TSDoc annotations do not need to be "complete," in the sense of fully documenting a given function. If only a single param needs explaining, then only that param needs annotation.

The TSDoc annotation format is as follows:

```typescript
/**
  * A description of the function
  * 
  * @param { type } paramName - Param description.
  * @param { type } secondParamName - Second param description.
  * @returns { type } A description of the return value.
  */
```

Thus, an example function might be documented as follows:

```typescript
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

A complete list of TSDoc tags can be found at [TSDoc.org](https://tsdoc.org/pages/tags/alpha/). Most functions, however, will only require the following two tags:

- `@param`: Used to document a function parameter.
- `@returns`: Used to document a function’s return value.

Additionally, we are moving towards use of the @deprecated to mark deprecated code.

### Inline comments

In cases where TSDoc is inappropriate for inline documentation, the following style guidelines should be observed instead:

- Place comments above the code they describe.
- Use comments to provide context and explain _why_ something is being done, not just 'what' is being done. This helps future developers understand the purpose and intent of the code.
- Use descriptive variable and function names to reduce the need for comments by making the code more self-explanatory.
- Datestamps, when used, should be formatted YYMMDD. In general, the [indexical language guidelines](./_README.md#indexicality--timestamps) recommended for documentation hold for inline comments as well.

## Error handling

### Backend Errors

Backend errors currently come in two varieties:

1. Errors instructive for the end user.
2. Errors instructive for the client.

Errors instructive for the user should be formatted with `formatErrorPretty` from the `errorUtils`. These will be displayed on the front end directly in the modal.

Errors instructive for the client should be directly passed to the backend. These should be handled by the backend for the possibility of taking recovery actions.

### Function declarations

Functions should be declared using const-based arrow syntax: `const x = () => {}` is preferred to `function x() {}`.

## Change Log

- 231010: Updated by Graham Johnson with TSDoc guidelines. Import guidelines removed until new approach is implemented. (#5254).
- 231010: Renamed from `Code-Requirements.md` to `Code-Style.md` (#5254).
- 230121: Authored by Forest Mars.
