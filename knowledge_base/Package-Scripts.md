# Package Scripts

This entry documents [the Commonwealth package.json file](../packages/commonwealth/package.json). `Package.json` scripts should always be organized alphabetically.

If you add a script to the `package.json` file, please add documentation for it here. As with [all documentation](./_README.md#updating-the-docs-how--when), this should be included in the PR alongside the script addition. Script aliases serve as headers and should be furnished with a *definition* (the bash code executed by a script alias) and a *description* detailing (1) what the script does (2) when engineers might want or need to use it. Finally, list the new sub-section in the table of contents below.

## Contents

* [Build Scripts](#build-scripts)
  + [build](#build)
  + [build-ci](#build-ci)
  + [heroku-prebuild](#heroku-prebuild)
  + [heroku-postbuild](#heroku-postbuild)
* [CI/CD](#cicd)
  + [wait-server](#wait-server)
* [Database](#database)
  + [clean-db](#clean-db)
  + [create-migration](#create-migration)
  + [db-all](#db-all)
  + [db-doc](#db-doc)
  + [dump-db](#dump-db)
  + [load-db](#load-db)
  + [migrate-db](#migrate-db)
  + [migrate-db-down](#migrate-db-down)
  + [psql](#psql)
  + [reset-db](#reset-db)
  + [reset-frack-db](#reset-frack-db)
  + [set-super-admin](#set-super-admin)
* [Devnets](#devnets)
  + [cosmos:build](#cosmosbuild)
  + [cosmos:start](#cosmosstart)
  + [cosmos:stop](#cosmosstop)
* [Docker](#docker)
  + [start-containers](#start-containers)
  + [start-docker-setup](#start-docker-setup)
* [Linting & Formatting](#linting--formatting)
  + [format](#format)
  + [lint-all](#lint-all)
  + [lint-branch](#lint-branch)
  + [lint-branch-warnings](#lint-branch-warnings)
  + [style-lint](#style-lint)
* [Playwright](#playwright)
  + [e2e-start-server](#e2e-start-server)
  + [emit-notification](#emit-notification)
  + [test-e2e](#test-e2e)
  + [test-e2e-serial](#test-e2e-serial)
* [Testing](#testing)
  + [integration-test](#integration-test)
  + [test](#test)
  + [test-api](#test-api)
  + [test-devnet](#test-devnet)
  + [test-integration-util](#test-integration-util)
  + [test-select](#test-select)
  + [test-suite](#test-suite)
  + [unit-test](#unit-test)
  + [unit-test:watch](#unit-testwatch)
* [TypeScript](#typescript)
  + [check-types](#check-types)
  + [sanity](#sanity)
* [Webpack && TSNode](#webpack--tsnode)
  + [bundle-report](#bundle-report)
  + [start](#start)
  + [start-all](#start-all)
  + [start-consumer](#start-consumer)
  + [start-evm-ce](#start-evm-ce)
* [Utils & Services](#utils--services)
  + [add-component-showcase](#add-component-showcase)
  + [send-cosmos-notifs](#send-cosmos-notifs)
  + [send-notification-digest-emails](#send-notification-digest-emails)

## Build Scripts

### build

Definition: `chmod u+x scripts/build.sh && ./scripts/build.sh`

Description:

- Default: Runs webpack on our front-end code with 4096MB memory allocated to Node
- Default: If successful, fires the commonwalth app build script
- Optional: To build other app workspaces, see `/scripts/build.sh` for configuration options

### build-ci

Definition: `pnpm add -g node-gyp && pnpm --ignore-engines && pnpm build && pnpm workspace commonwealth migrate-db`

Description:

- Installs node-gyp (a library for compiling dependencies) prior to installing dependencies. Fixes error we get when building dependencies which blocks production releases and fails CI runs.
- Installs node modules, ignoring engine errors
- Runs the default application build script (above)
- Runs db migrations

### heroku-prebuild

Definition: `pnpm add -g node-gyp`

Description: Installs node-gyp (a library for compiling dependencies) prior to installing dependencies. Fixes error we get when building dependencies which blocks production releases and fails CI runs.

### heroku-postbuild

Definition: `chmod u+x scripts/heroku-build.sh && ./scripts/heroku-build.sh`

Description:

- Builds project on Heroku by calling application build script (above), using configuration variables (CW_BUILD, SL_BUILD, DL_BUILD)
- Cleans other apps and unnecessary code in the monorepo

## CI/CD

### wait-server

Definition: `chmod +x ./scripts/wait-server.sh && ./scripts/wait-server.sh`

Description: Used for CI. Waits for the server to be ready (start serving on port 8080).

Contributor: Kurtis Assad

## Database

### clean-db

Definition: `tsx  server/scripts/cleanDb.ts`

Description: This executes series of 'cleaner' functions that delete unnecessary data from the database, particularly notification and subscription data. For more documentation, see databaseCleaner.ts. On prod, the cleaner functions run daily.

Considerations: Engineers will almost never need to use this locally (unless they have purposefully create a large number of test notifications). This script was authored at the request of Jake Naviasky; we should confer with him as to the long-term value of this script. **Flagged for possible removal.**

Contributor: Timothee Legros

### create-migration

Definition: `npx sequelize migration:generate --name`

Description: Generates a new database migration file, taking a passed argument in kebab-case as a name (e.g. `pnpm create-migration remove-user-last-visited-col`).

### db-all

Definition: `pnpm reset-db && pnpm load-db && pnpm migrate-db`

Description: Resets, loads, and migrates db (composite script).

Contributor: Kurtis Assad

### db-doc

Definition: `chmod u+x scripts/gen-mermaid-erd.sh && ./scripts/gen-mermaid-erd.sh > ../../knowledge_base/wiki/Database-ERD.md`

Description: This pulls the schema from a local Postgres instance and generates a Mermaid ERD, updating `/knowledge_base/wiki/Database-ERD.md`

Considerations:

- Using a local PG instance with the default configuration. Developers must ensure it has the latest schema
- Recommended after major database migrations (adding/removing tables/fields/relationships)
- Not integrated (CI) yet, need to review how we incorporate file changes from GH actions back to the repo

Contributor: Roger Torres

### dump-db

Definition: `pg_dump $(heroku config:get HEROKU_POSTGRESQL_MAROON_URL -a commonwealth-beta) --verbose --exclude-table-data=\"public.\\\"Subscriptions\\\"\" --exclude-table-data=\"public.\\\"Sessions\\\"\" --exclude-table-data=\"public.\\\"DiscussionDrafts\\\"\" --exclude-table-data=\"public.\\\"LoginTokens\\\"\" --exclude-table-data=\"public.\\\"Notifications\\\"\" --exclude-table-data=\"public.\\\"Webhooks\\\"\" --exclude-table-data=\"public.\\\"NotificationsRead\\\"\" --no-privileges --no-owner -f latest.dump`

Description: Creates a database dump file, `latest.dump`, from Heroku's commonwealth-beta db, excluding several tables such as DiscussionDrafts, Subscriptions, and Notifications.

### load-db

Definition: `chmod u+x scripts/load-db.sh && ./scripts/load-db.sh`

Description: Loads database following the `load-db.sh` script. Looks for dump file `latest.dump` by default; if script is called with an argument, the value of DUMP_NAME will be updated to that argument's value.

### migrate-db

Definition: `npx sequelize db:migrate`

Description: Migrates database, using migration files in `./server/migration` directory.

### migrate-db-down

Definition: `npx sequelize db:migrate:undo`

Description: Undoes the last-run Sequelize migration.

### psql

Definition: `chmod u+x scripts/start-psql.sh && ./scripts/start-psql.sh`

Description: Start a PostgreSQL instance.

### reset-db

Definition: `chmod u+x scripts/reset-db.sh && ./scripts/reset-db.sh`

Description: Resets the local database.

### reset-frack-db

Definition: `heroku pg:copy commonwealth-beta::HEROKU_POSTGRESQL_MAROON_URL DATABASE_URL --app commonwealth-frack --confirm commonwealth-frack`

Description: Synchronizes `beta-db` (used for QA) against the `frack-db` (used for CDN cache testing). Good for undoing migration script run in previous commit to Frack. See [Testing Environments](./Testing-Environments.md) entry for more info.

### set-super-admin

Definition: `chmod u+x scripts/set-super-admin.sh && ./scripts/set-super-admin.sh`

Description: It sets whether a user is a super admin or not. The script accepts 2 optional arguments that indicate the environment in which to set the super admin and whether to enable or disable the super admin. The script enables the super admin by default.

Considerations: This script requires having SUPER_ADMIN_EMAIL or SUPER_ADMIN_WALLET_ADDRESS set in packages/commonwealth/.env. The script also requires having Heroku access on any apps in which a super admin status is being updated.

Examples:

- `pnpm set-super-admin`
  - This sets the local user specified by the environment variables to a super admin.
- `pnpm set-super-admin false`
  - This disables super admin for the local user.
- `pnpm set-super-admin [frick | frack | beta | demo]`
  - This enables super admin for the specified user on the specified app.
- `pnpm set-super-admin [frick | frack | beta | demo] false`
  - This disables super admin for the specified user on the specified app.

## Docker

### start-containers

Definition: `chmod +rx ./scripts/start-docker-containers.sh && ./scripts/start-docker-containers.sh`

Description: Starts remote Docker containers; see [start-docker-containers.sh](../packages/commonwealth/scripts/start-docker-containers.sh) for further documentation.

### start-docker-setup

Definition: `chmod +rx ./scripts/start-docker-setup-help.sh && ./scripts/start-docker-setup-help.sh`

Description: To be run in a new project or repo when first setting up remote docker containers. See [start-docker-setup-help.sh](../packages/commonwealth/scripts/start-docker-setup-help.sh) for further documentation.

## Linting & Formatting

Open considerations: Given our Prettier pre-commit hook, this amount of linting and formatting commands may be unnecessary.

### format

Definition: `prettier --ignore-path ../../.prettierignore --config ../../.prettierrc.json --write .`

Description: Autoformats files using config `prettierrc.json` config.

### lint-all

Definition: `eslint client/\\**/*.{ts,tsx} server/\\**/*.ts`

Description: Lints all TypeScript files within the `client` and `server` directories.

### lint-branch

Definition: `./scripts/lint-branch.sh`

Description: Used in the CI. Lints updated files on the current branch.

### lint-branch-warnings

Definition: `FAIL_WARNINGS=1 ./scripts/lint-branch.sh`

Description: Used in the CI. Lints based on the target branch, fails on linter warnings

### style-lint

Definition: `stylelint client/styles/*`

Description: Lints SCSS files.

Considerations: Why lint styles separately? Why not just include `.scss` file extension in [lint-branch](#lint-branch) and [lint-all](#lint-all) scripts (which currently only target `.ts` files)? **Flagged for possible removal.**

## Playwright

### e2e-start-server

Definition: `ETH_RPC=e2e-test pnpm start`

Description: Starts the app server with the ETH_RPC env variable set to “e2e-test,” to trigger our MockMetaMask provider for wallet testing.

Contributor: Kurtis Assad

### emit-notification

Definition: `tsx  server/scripts/emitTestNotification.ts`

Description: Emits a chain-event or snapshot notification. Run `pnpm emit-notification --help` to see options.

Contributor: Timothee Legros

### test-e2e

Definition: `TEST_ENV=playwright npx playwright test -c ./test/e2e/playwright.config.ts --workers 2 ./test/e2e/e2eRegular/*`

Description: Runs Playwright tests using the playwright.config.ts file.

Contributor: Kurtis Assad

### test-e2e-serial

Definition: `TEST_ENV=playwright npx playwright test --workers 1 ./test/e2e/e2eSerial/*`

Description: Runs e2e tests one at a time, to avoid problems of parallel execution.

Contributor: Kurtis Assad

## Testing

Open considerations:

- When and why do we invoke `nyc` and `NODE_ENV=test` in our scripts? No clear rhyme or reason to our use.
  - `nyc` runs IstanbulJS, which tracks and reports how much of our source code is covered by tests. `NODE_ENV=test` sets a global variable that changes how select parts of our wallet and chain infrastructure runs.
- Do we need so many different scripts for specifying which part of the codebase we want to test? Would a generic test script, taking a directory as argument, suffice?
  - See e.g. [test-select](#test-select)
- Any test scripts we remove, we should ensure their respective invocations in `CI.yml` are replaced with appropriate definitions.

### integration-test

Definition: `NODE_OPTIONS='--import tsx/esm' NODE_ENV=test mocha  './test/integration/**/*.spec.ts'`

Description: Runs all tests in our integration folder and its subdirectories.

Considerations: This script breaks our more usual test script syntax, which typically begin with the "test-" prefix followed by the directory tested. We should also keep an eye on similar integration-scoped test scripts; there may be redundancies.

### test

See `unit-test`.

### test-api

Definition: `NODE_OPTIONS='--import tsx/esm' NODE_ENV=test mocha --allow-uncaught './test/integration/api/**/*.spec.ts'`

Description: Runs all tests in the /api subfolder of the /integration directory.

### test-devnet

Definition: `NODE_OPTIONS='--import tsx/esm' NODE_ENV=test mocha ./test/devnet/**/*.spec.ts`

Description: Runs all tests in our `/devnet` folder. If `cosmos` is given as the first argument then run only the tests in `./test/devnet/cosmos/**/*.spec.ts`. If `evm` is given as the first argument then run only the tests in `./test/devnet/evm/**/*.spec.ts`.

### test-integration-util

Definition: `NODE_OPTIONS='--import tsx/esm' NODE_ENV=test mocha ./test/integration/*.spec.ts`

Description: Runs tests living in the top level of our integration folder, where we house tests that require "integrated" components (e.g. tests that need access to a live Postgres database or a live Redis instance, rather than to the mock Postgres or Redis instances we use in util testing).

Considerations: The script name might misleadingly suggest that this script would pick out specifically the /util subfolder in the /integration directory. Might we be better off moving the three top-level scripts (e.g. databaseCleaner.spec.ts) into a dedicated subfolder, and targeting that?

Contributor: Timothee Legros

### test-select

Definition: `NODE_OPTIONS='--import tsx/esm' NODE_ENV=test mocha`

Description: Append a path to run specific test files or folders.

### test-suite

Definition: `NODE_OPTIONS='--import tsx/esm' NODE_ENV=test mocha './test/**/*.spec.ts'`

Description: Runs all tests in our /test directory.

Considerations: This is equivalent to our `test` script but with `NODE_ENV=test` added. Why? Do we actually need both versions? **Flagged for possible removal.**

### unit-test

Definition: `NODE_OPTIONS='--import tsx/esm' NODE_ENV=test mocha './test/unit/seed_hack.spec.ts' && NODE_OPTIONS='--import tsx/esm --experimental-loader esm-loader-css' NODE_ENV=test FEATURE_FLAG_GROUP_CHECK_ENABLED=true mocha './test/unit/**/*.spec.ts'`

Description: Tests all .spec files within the `./test/unit` sub-directory of test folder.

Considerations: This script breaks our more usual test script syntax, which typically begin with the "test-" prefix followed by the directory tested.

Contributor: Ryan Bennett

### unit-test:watch

Definition: `NODE_OPTIONS='--import tsx/esm --experimental-loader esm-loader-css' NODE_ENV=test mocha --timeout 10000 './test/unit/**/*.spec.ts' --watch-files '**/*.ts'`

Description: Watches for changes to any .spec files within `./test/unit` and automatically runs test when they are updated.

Considerations: This script breaks our more usual test script syntax, which typically begin with the "test-" prefix followed by the directory tested.

Contributor: Ryan Bennett

## TypeScript

### check-types

Definition: `tsc --noEmit`

Description: Runs a compilation of TypeScript files based on tsconfig.json; does not emit files.

### sanity

Definition: `chmod u+x scripts/sanity.sh && ./scripts/sanity.sh`

Description: Sanity scripts developers should run locally before pushing code, comprising a linter, a check-types, and unit tests. Must be run from root.

## Webpack && TSNode

### bundle-report

Definition: `webpack-bundle-analyzer --port 4200 build/stats.json`

Description:  Runs webpack-bundle-analyzer library to display breakdown of bundle size & makeup, hosted on port 4200 (localhost:4200). To generate a stats.json file, navigate to [webpack.prod.config.mjs](../packages/commonwealth/webpack/webpack.prod.config.mjs), set the `generateStatsFile` key to true, run `pnpm build` , and finally `pnpm bundle-report`.
### start

Definition: `tsx watch  --max-old-space-size=4096 server.ts`

Description: Windows-compatible start script. Used to start the Commonwealth app in development.

### start-all

Definition: `concurrently -p '{name}' -c red,green -n app,consumer 'pnpm start' 'pnpm start-consumer'`

Description: Runs `pnpm start` and `pnpm start-consumer` (i.e., the main app server, and the CommonwealthConsumer script) concurrently with the `concurrently` package.

### start-consumer

Definition: `tsx  server/workers/commonwealthConsumer/commonwealthConsumer.ts`

Description: Runs `CommonwealthConsumer.ts` script, which consumes & processes RabbitMQ messages from external apps and services. See script file for more complete documentation.

### start-evm-ce

Definition: `tsx  server/workers/evmChainEvents/startEvmPolling.ts`

Description: Runs `startEvmPolling.ts` script, which polls Ethereum chains for events in order to generate notifications.

## Devnets

### cosmos:build

Definition: `chmod u+x test/util/cosmos-chain-testing/v1/start.sh && ./test/util/cosmos-chain-testing/v1/start.sh --build && chmod u+x test/util/cosmos-chain-testing/v1beta1/start.sh && ./test/util/cosmos-chain-testing/v1beta1/start.sh --build && chmod u+x test/util/cosmos-chain-testing/ethermint/start.sh && ./test/util/cosmos-chain-testing/ethermint/start.sh --build`

Description: Fetches Docker images for all Cosmos devnets (evmos, v1beta1, and v1) and starts containers for each.

### cosmos:start

Definition: `chmod u+x test/util/cosmos-chain-testing/v1/start.sh && ./test/util/cosmos-chain-testing/v1/start.sh && chmod u+x test/util/cosmos-chain-testing/v1beta1/start.sh && ./test/util/cosmos-chain-testing/v1beta1/start.sh && chmod u+x test/util/cosmos-chain-testing/ethermint/start.sh && ./test/util/cosmos-chain-testing/ethermint/start.sh`

Description: Starts existing dormant Cosmos devnet containers.

### cosmos:stop

Definition: `chmod u+x test/util/cosmos-chain-testing/v1/stop.sh && ./test/util/cosmos-chain-testing/v1/stop.sh && chmod u+x test/util/cosmos-chain-testing/v1beta1/stop.sh && ./test/util/cosmos-chain-testing/v1beta1/stop.sh && chmod u+x test/util/cosmos-chain-testing/ethermint/stop.sh && ./test/util/cosmos-chain-testing/ethermint/stop.sh`

Description: Stop all Cosmos devnet containers.

## Utils & Services

### add-component-showcase

Definition: `add-component-showcase`

Description: It creates new `tsx` file and modifies `componentsList.ts` file in order to add components to the showcase page easier. For more information take a look at [Component-Kit.md](./Component-Kit.md) documentation file.

### send-cosmos-notifs

Definition: `node --max-old-space-size=$(../../scripts/get-max-old-space-size.sh) build/server/workers/cosmosGovNotifications/generateCosmosGovNotifications.js`

Description: Generates Cosmos v1 and v1beta1 governance notifications by polling relevant Cosmos chains.

Contributor: Timothee Legros

### send-notification-digest-emails

Definition: `SEND_EMAILS=true tsx  server.ts`

Description: Schedules a daily task for sending notification email digests.
