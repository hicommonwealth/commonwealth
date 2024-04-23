# Linting

## Contents

- [Commands](#commands)
- [Configuration](#configuration)
- [Formatting](#formatting)
- [Formatting Commands](#formatting-commands)
- [Change Log](#change-log)

## ESLint

### Commands

All linting commands should be run from root.

- `yarn lint-all`
  - Lints all code (regardless of changes)
- `yarn lint-branch`
  - Lints all changes made in a branch (used in CI).

## Configuration

There is a single root `.eslintrc.js` file. All packages inherit from this config. Child configs in specific packages can modify/override the rules as well as the settings defined by the parent config.

Global rules we eventually want to turn back on:

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/consistent-type-imports`

We will slowly remove rules turned off in the Commonwealth `.eslintrc.js`

### Plugins

We use an `eslint-diff` plugin that only applies rules to changed files. This runs in our CI.

## Prettier Formatting

We use Prettier for formatting our codebase. There is only 1 prettier config and it is `.prettierrc.json` at the root of the repo.

*Never run prettier from anywhere other than root to avoid conflicting prettier configs!*

Prettier is not enforced by our CI, but runs during precommit via a Husky hook, which formats all files diverging from master. `yarn install` must have been run on your machine for the precommit hook to work.

### Formatting Commands

Formatting commands should **always** be executed from root.

- `yarn format`
  - execute prettier and format the entire repo
- `yarn format-check`
  - execute prettier in check mode which means it lists files that require formatting but doesn't actually format them

## Handling linting issues

### Background

We run `eslint` and the `eslint-diff` plugin to find issues with our source code which augment the typescript compiler.

Lint issues have traditionally/initially involved minor issues with spacing but now they can catch very real and very serious bugs.

As of 240423, common bugs in our codebase include React and promise bugs that we’re trying to block.  

## Incorrect Use of Promises

This is a common one and these are almost certainly bugs. They are mostly just due to dangling promises where you’re either not calling `await` or `catch`.

The solution is to either call catch() then log the error or you have to call `await` and have it in an `async` function.  

Here’s are a few examples

**Not awaiting promises:**

```
async function doSubmit() {
   sendDataToServer(data)
}
```

This function is an async function that calls sendDataToServer but there is no await there.

Instead you should change it to:

```
async function doSubmit() {
   await sendDataToServer(data)
}
```

**Passing async functions to event handlers**

This is another common problem

```
async function sendDataToServer() {
   // send the data to the server using the fetch API
}

return (
  <button onClick={sendDataToServer}>Submit</button> 
);
```

There’s no catch() called on sendDataToServer so if an error happens the user is never notified.

You can fix it by doing the following:

```
function handleClick() {
  sendDataToServer()
    .catch(err => log.error(err)}
}

return (
  <button onClick={handleClick>Submit</button> 
);
```

## No Explicit Any

This will happen when you use the ‘any’ in code for variables and types.

Honestly the main solution is to NEVER use `any`. 95% of the time you or someone else is going to shoot themselves in the foot. It’s usually a future developer though or usually an issue with

There are some reasonable exceptions though:

**REST API calls that aren’t typed**

In this situation a workable solution is to define types inline, then use those types, then disable the next line in eslint with just the specific rule violation.

# Disabling Rules

If you can’t properly fix an issue you MUST disable the next line using the official eslint mechanism to disable the next line.

There is an explicit mechanism to do this in eslint and it’s really easy to use and just requires you to add a comment.

You DO NOT need to do anything fancy to disable the rule.

## Disable next line

The main way to fix an eslint issue is to just disable the next line with a specific rule.

For example:

```
// eslint-disable-next-line @typescript-eslint/no-misused-promises
```

Note the fact that this JUST disables the `@typescript-eslint/no-misused-promises`for promises handling

<p id="gdcalert1" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image1.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert2">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>

![alt_text](images/image1.png "image_tooltip")

You **must** include the rule in to disable just that one specific rule.

Ideally you would also explain why you’re disabling the rule as well.

There are valid reasons why you would want to

## Turning Off Eslint Diff

If something goes wrong and you need to totally disable eslint-diff you can just change it in CI.yml

You can just look for the following code

```
      # To disable eslint-diff just comment the following two lines
      - name: Run eslint-diff
        run: yarn workspace commonwealth run lint-diff
```

# Things NOT to do

## Do not disable lint on the entire file

Do not add a // estlint-disable comment in the entire file.  This will disable lint-diff moving forward and any issues.

ALWAYS use eslint-disable-next line so we lower the blast radius.  

## Do NOT disable the entire next line (regardless of error code)

If you JUST use //eslint-disable-next-line and new bugs are introduced in the future, eslint won’t generate an error on those lines.  

## Change Log

- 231012: Flagged by Graham Johnson for review. Recommendations out of date; greater clarity and context desirable.
- 230830: Split off by Graham Johnson from [Code-Style](./Code-Style.md) entry.
