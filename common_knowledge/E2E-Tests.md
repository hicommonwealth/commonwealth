# E2E Tests

E2E tests assess an app from the user’s perspective, locating and interacting with elements on rendered pages.

## Contents

- [Writing E2E Tests](#writing-e2e-tests)
- [Example Test](#example-test)
- [File Structure](#file-structure)
- [General Tips for Writing E2E Tests](#general-tips-for-writing-e2e-tests)
- [Running E2E Tests](#running-e2e-tests)
  + [Locally](#locally)
  + [On CI](#on-ci)
- [Debugging E2E Tests](#debugging-e2e-tests)
- [Change Log](#change-log)

## Writing E2E Tests

E2E tests are written in the Playwright framework, consisting of element-locator methods (e.g. `page.locator`), element-interaction methods (e.g. `.click`), and expectations (e.g. `expect(page).toHaveTitle`). A more complete list can be found in [Playwright's Docs](https://playwright.dev/docs/writing-tests).

The Playwright Inspector GUI's auto-gen functionality allows you to interact (as you normally would) with the site, constructing a series of tests that replicate your interactions.

## Example Test

```js
test('Can click on Sign in button', async ({ page: Page }) => {
  await page.goto(`http://localhost:${PORT}/`);
  const loginButton = await page.locator('.desktop-login');
  await loginButton.click();

  const loginModal = await page.locator('.LoginDesktop');
  expect(loginModal).toBeTruthy();
});
```

## File Structure

E2E tests are housed in the following subdirectories of `packages/commonwealth/test/e2e`:

- `/e2eStateful`: Stateful journeys that assume seeded entities and carry multi-step progression.

- `/e2eSerial`: Tests that must run in serial to avoid race conditions.

- `/e2eRegular`: Main E2E suite. Includes smoke checks, route matrix checks, security checks, and feature behavior tests.

Additionally:
- `/mature`: Longer-running maturity scenarios.
- `/helpers`: Shared fixtures/selectors/auth and navigation helpers.

Corresponding package scripts for running tests are documented in [Package-Scripts.md](./Package-Scripts.md).

At the file level, each testing file should represent one and only one URI route. See for example `discussions.spec.ts`. This file should only ever navigate to `/discussions`.

## General Tips for Writing E2E Tests

- Try to make locators as general and robust as possible, locating by class name rather than, e.g. the element's inner text.

- Avoid using index-based locating for buttons (e.g. "3rd item in list") unless the list is used to display data.

- Avoid using `while` loops to wait for an assertion flow. Instead use `expect(...).toPass()`.

- Add reusable functions in the `E2EUtils` file.

- If you are using `E2EDbEntityHooks`, avoid relying on specific ordering properties, as test order cannot be ensured.

- Don't delete any entities from the `entityHooks` during runtime. This ensures other tests can use them. If you want to test deletion, first create the entity yourself instead, to be deleted in the test.

- Testing should be fast. We should build them in a way where we can trade off compute power for time.

## Running E2E Tests

Local development is preferred over CI development. We should make use of all the threads in order to run tests. This is especially important for E2E testing, as most of the time is spent waiting.

### Locally

To run E2E tests locally:
1. Start server stack with mocked wallet support:
   - `pnpm -F commonwealth e2e-start-server`
2. Run the desired suite:
   - `pnpm -F commonwealth test-e2e` (regular)
   - `pnpm -F commonwealth test-e2e-smoke` (smoke-tagged subset)
   - `pnpm -F commonwealth test-e2e-refactor` (`@refactor` coverage subset)
   - `pnpm -F commonwealth test-e2e-serial` (serial-only suite)
   - `pnpm -F commonwealth test-e2e-mature` (mature suite)
   - `pnpm -F commonwealth test-e2e-stateful` (stateful suite)

CI runs with `--forbid-only`; use the same flag locally when validating PR-readiness.

### On CI

CI uses `wait-server` to gate test start and runs purpose-specific jobs:
- smoke + refactor route safety checks in PR lane
- serial suite in production-server checks
- mature + serial + stateful suites in the scheduled/manual refactor-hardening workflow
- visual checks in compare mode, with a separate baseline update workflow

## Debugging E2E Tests

When E2E tests fail, we record a video of the failed run. These videos can be viewed and navigated via Playwright's [Trace Viewer](https://trace.playwright.dev/).

- If you add `--debug` to an E2E command, Playwright opens an interactive debug UI for step-through execution and locator inspection. Example: `pnpm -F commonwealth test-e2e -- --debug`

- Locally: Videos are stored in the `test-results` folder and named after the failing test.

- CI: Videos are uploaded as workflow artifacts and can be downloaded from the run summary page.

## Change Log

- 231024: Updated by Graham Johns with notes from L&L presentation (#5446)
- 230907: Authored by Kurtis Assad (#4963)
