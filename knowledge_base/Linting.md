# Linting

## Contents

- [ESLint](#eslint)
  * [Commands](#commands)
  * [Configuration](#configuration)
- [Prettier Formatting](#prettier-formatting)
  * [Formatting Commands](#formatting-commands)
- [Handling Linting Issues: Cheatsheet](#handling-linting-issues-cheatsheet)
  * [Incorrect Use Of Promises](#incorrect-use-of-promises)
    + [Not Awaiting Promises](#not-awaiting-promises)
    + [Passing Async Functions To Event Handlers](#passing-async-functions-to-event-handlers)
  * [No Explicit Any](#no-explicit-any)
    + [REST API Calls That Aren't Typed](#rest-api-calls-that-arent-typed)
  * [Disabling Rules](#disabling-rules)
  * [Disabling Next Line](#disabling-next-line)
    + [Turning Off Eslint Diff](#turning-off-eslint-diff)
  * [Things Not To Do](#things-not-to-do)
    + [Do Not Disable Lint On The Entire File](#do-not-disable-lint-on-the-entire-file)
    + [Do Not Disable The Entire Next Line](#do-not-disable-the-entire-next-line)
- [Change Log](#change-log)

## ESLint

We use ESLint and the eslint-diff plugin for linting.

### Commands

All linting commands should be run from root.

- `pnpm lint-all`
  - Lints all code (regardless of changes)
- `pnpm lint-branch`
  - Lints all changes made in a branch (used in CI)

### Configuration

There is a single root `.eslintrc.js` file. All packages inherit from this config. Child configs in specific packages can modify/override the rules as well as the settings defined by the parent config.

Global rules we eventually want to turn back on:

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/consistent-type-imports`

We will slowly remove rules turned off in the Commonwealth `.eslintrc.js`.

Configuration for the eslint-diff plugin is housed in [.eslintrc-diff.js](../packages/commonwealth/.eslintrc-diff.js).

## Prettier Formatting

We use Prettier for formatting our codebase. There is only 1 Prettier config and it is `.prettierrc.json` at the root of the repo.

*Never run Prettier from anywhere other than root to avoid conflicting Prettier configs!*

Prettier is not enforced by our CI, but runs during precommit via a Husky hook, which formats all files diverging from master. `pnpm install` must have been run on your machine for the precommit hook to work.

### Formatting Commands

Formatting commands should *always* be executed from root.

- `pnpm format`
  - Execute Prettier and format the entire repo
- `pnpm format-check`
  - Execute Prettier in `check` mode, so that it lists all files requiring formatting, but doesn't automatically format them

## Handling Linting Issues: Cheatsheet

*Written by Kevin Burton, 240422.*

As of 240422, common bugs in our codebase include React and promise bugs that we’re trying to block. Lint issues have traditionally/initially involved minor issues with spacing but now they can catch very real and very serious bugs.

### Incorrect Use Of Promises

This is a common issue, and these are almost certainly bugs. They are mostly due to dangling promises where you’re either not calling `await` or `catch`.

The solution is to either call `catch()`, then log the error, or to call `await` and wrap it in an `async` function.  

Here are a few examples:

#### Not Awaiting Promises

```ts
async function doSubmit() {
  sendDataToServer(data);
}
```

This function is an async function that calls `sendDataToServer` but lacks an `await`.

It should be changed to:

```ts
async function doSubmit() {
  await sendDataToServer(data);
}
```

#### Passing Async Functions To Event Handlers

This is another common problem

```tsx
async function sendDataToServer() {
  // send the data to the server using the fetch API
}

return (
  <button onClick={sendDataToServer}>Submit</button> 
);
```

There’s no `catch()` called on `sendDataToServer`, so if an error occurs, the user is never notified.

It can be fixed with the following:

```tsx
function handleClick() {
  sendDataToServer()
    .catch(err => log.error(err));
}

return (
  <button onClick={handleClick}>Submit</button> 
);
```

### No Explicit Any

This will happen when you use `any` in code for variables and types.

The main solution is to *never* use `any`. 95% of the time, you or someone else is going to shoot themselves (or a future developer) in the foot.

There are some reasonable exceptions though:

#### REST API Calls That Aren't Typed

In this situation a workable solution is to define types inline, then use those types, then disable the next line in eslint with just the specific rule violation.

### Disabling Rules

If you can’t properly fix an issue you *must* disable the next line using the official eslint mechanism to disable the next line.

There is an explicit mechanism to do this in eslint and it’s really easy to use and just requires you to add a comment.

You *do not* need to do anything fancy to disable the rule.

### Disabling Next Line

The main way to fix an eslint issue is to just disable the next line with a specific rule.

For example:

```ts
// eslint-disable-next-line @typescript-eslint/no-misused-promises
```

Note the fact that this JUST disables the `@typescript-eslint/no-misused-promises`for promises handling

```tsx
<CWText type="b1" fontWeight="medium">
  {formatAddressShort(contractAddress, 5, 5)}
  <CWIcon
    className="copy-icon"
    iconName="copyNew"
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onClick={async () => await saveToClipboard(contractAddress, true)}
  />
</CWText>
```

You *must* include the rule in to disable just that one specific rule.

Ideally you would also explain why you’re disabling the rule as well.

#### Turning Off Eslint Diff

If something goes wrong and you need to totally disable eslint-diff you can just change it in `CI.yml`.

You can just look for the following code

```yml
# To disable eslint-diff just comment the following two lines
- name: Run eslint-diff
  run: pnpm workspace commonwealth run lint-diff
```

### Things Not To Do

#### Do Not Disable Lint On The Entire File

Do not add a `// estlint-disable` comment to the entire file. This will disable `lint-diff` moving forward, and any issues it might raise. *Always* use `eslint-disable-next-line` so we lower the blast radius.  

#### Do Not Disable The Entire Next Line

Regardless of error code, the entire next line should never be disabled with `//eslint-disable-next-line`. If new bugs are introduced in the future, eslint won’t generate an error on those lines.  

## Change Log

- 240425: Linting cheatsheet added by Kevin Burton and Graham Johnson (#7571).
- 231012: Flagged by Graham Johnson for review. Recommendations out of date; greater clarity and context desirable.
- 230830: Split off by Graham Johnson from [Code-Style](./Code-Style.md) entry.
