This entry documents [the Commonwealth package.json file](../packages/commonwealth/package.json). `Package.json` scripts should always be organized alphabetically.

If you add a script to the package.json, you must add documentation here, describing (1) what the script does (2) when engineers might want or need to use it. As with [all documentation](./_README.md#updating-the-docs-how--when), this should be included in the PR alongside the script addition.

# Contents

- [Build Scripts](#build-scripts)
  - [build-all](#build-all)
  - [heroku-postbuild](#heroku-postbuild)
  - [heroku-prebuild](#heroku-prebuild)
- [CI Scripts](#ci-scripts)
  - [wait-server](#wait-server)
- [Database Scripts](#database-scripts)
  - [clean-db](#clean-db)
  - [create-migration](#create-migration)
  - [db-all](#db-all)
  - [dump-db](#dump-db)
  - [dump-db-limit](#dump-db-limit)
  - [load-db](#load-db)
  - [load-db-limit](#load-db-limit)
  - [migrate-db](#migrate-db)
  - [migrate-db-down](#migrate-db-down)
  - [psql](#psql)
  - [reset-db](#reset-db)
  - [reset-frack-db](#reset-frack-db)
- [Linting & Formatting](#linting--formatting)
  - [format](#format)
  - [lint](#lint)
  - [lint-all](#lint-all)
  - [lint-branch](#lint-branch)
  - [lint-branch-warnings](#lint-branch-warnings)
  - [style-lint](#style-lint)
- [Mobile](#mobile)
  - [build-android](#build-android)
  - [build-ios](#build-ios)
  - [open-android](#open-android)
  - [open-ios](#open-ios)
  - [start-android](#start-android)
  - [start-ios](#start-ios)
- [Other Services](#other-services)
  - [datadog-db-setup](#datadog-db-setup)
  - [send-cosmos-notifs](#send-cosmos-notifs)
  - [send-notification-digest-emails](#send-notification-digest-emails)
- [Playwright](#playwright)
  - [e2e-start-server](#e2e-start-server)
  - [test-e2e](#test-e2e)
  - [test-e2e-serial](#test-e2e-serial)
- [Testing](#testing)
  - [integration-test](#integration-test)
  - [test](#test)
  - [test-api](#test-api)
  - [test-devnet](#test-devnet)
  - [test-emit-notif](#test-emit-notif)
  - [test-integration-util](#test-integration-util)
  - [test-select](#test-select)
  - [test-suite](#test-suite)
  - [unit-test](#unit-test)
  - [unit-test:watch](#unit-testwatch)
- [TypeScript](#typescript)
  - [build-consumer](#build-consumer)
  - [check-types](#check-types)
- [Webpack & TSNode](#webpack--tsnode)
  - [bundle-report](#bundle-report)
  - [listen](#listen)
  - [start](#start)
  - [start-all](#start-all)
  - [start-consumer](#start-consumer)
  - [start-evm-ce](#start-evm-ce)
- [Devnets](#devnets)
  - [cosmos:build](#cosmos:build)
  - [cosmos:start](#cosmos:start)
  - [cosmos:stop](#cosmos:stop)

# Build Scripts

## Application Build

Script: `yarn build`

Definition: `chmod u+x scripts/build.sh && ./scripts/build.sh`

Description:

- Default: Runs webpack on our front-end code with 4096MB memory allocated to Node
- Default: If successful, fires the commonwalth app build script
- Optional: To build other app workspaces, see `/scripts/build.sh` for configuration options

## CI Build

Script: `yarn build-ci`

Definition: `yarn global add node-gyp && yarn --ignore-engines && yarn build && yarn workspace commonwealth migrate-db`

Description:

- Installs node-gyp (a library for compiling dependencies) prior to installing dependencies. Fixes error we get when building dependencies which blocks production releases and fails CI runs.
- Installs node modules, ignoring engine errors
- Runs the default application build script (above)
- Runs db migrations

## Heroku Build

### heroku-prebuild

Definition: `yarn global add node-gyp`

Description: Installs node-gyp (a library for compiling dependencies) prior to installing dependencies. Fixes error we get when building dependencies which blocks production releases and fails CI runs.

### heroku-postbuild

Definition: `chmod u+x scripts/heroku-build.sh && ./scripts/heroku-build.sh`

Description:

- Builds project on Heroku by calling application build script (above), using configuration variables (CW_BUILD, SL_BUILD, DL_BUILD)
- Cleans other apps and unnecessary code in the monorepo

# CI Scripts

## wait-server

Definition: `chmod +x ./scripts/wait-server.sh && ./scripts/wait-server.sh`

Description: Used for CI. Waits for the server to be ready (start serving on port 8080).

Contributor: Kurtis Assad

# Database Scripts

## clean-db

Definition: `ts-node --project tsconfig.json server/scripts/cleanDb.ts`

Description: This executes series of 'cleaner' functions that delete unnecessary data from the database, particularly notification and subscription data. For more documentation, see databaseCleaner.ts. On prod, the cleaner functions run daily.

Considerations: Engineers will almost never need to use this locally (unless they have purposefully create a large number of test notifications). This script was authored at the request of Jake Naviasky; we should confer with him as to the long-term value of this script. **Flagged for possible removal.**

Contributor: Timothee Legros

## create-migration

Definition: `npx sequelize migration:generate --name`

Description: Generates a new database migration file, taking a passed argument in kebab-case as a name (e.g. `yarn create-migration remove-user-last-visited-col`).

## db-all

Definition: `yarn reset-db && yarn load-db && yarn migrate-db`

Description: Resets, loads, and migrates db (composite script).

Contributor: Kurtis Assad

## dump-db

Definition: `pg_dump $(heroku config:get CW_READ_DB -a commonwealth-beta) --verbose --exclude-table-data=\"public.\\\"Subscriptions\\\"\" --exclude-table-data=\"public.\\\"Sessions\\\"\" --exclude-table-data=\"public.\\\"DiscussionDrafts\\\"\" --exclude-table-data=\"public.\\\"LoginTokens\\\"\" --exclude-table-data=\"public.\\\"Notifications\\\"\" --exclude-table-data=\"public.\\\"Webhooks\\\"\" --exclude-table-data=\"public.\\\"NotificationsRead\\\"\" --no-privileges --no-owner -f latest.dump`

Description: Creates a database dump file, `latest.dump`, from Heroku's commonwealth-beta db, excluding several tables such as DiscussionDrafts, Subscriptions, and Notifications.

## dump-db-limit

Definition: `yarn run dump-db && psql $(heroku config:get CW_READ_DB -a commonwealth-beta) -a -f limited_dump.sql`

Description: In addition to running the [dump-db](#dump-db) script, this copies a limited set of Notification and Subscription data from the commonwealth-beta Heroku database. Used in conjunction with the [load-db-limit](#load-db-limit) script.

## load-db

Definition: `chmod u+x scripts/load-db.sh && ./scripts/load-db.sh`

Description: Loads database following the `load-db.sh` script. Looks for dump file `latest.dump` by default; if script is called with an argument, the value of DUMP_NAME will be updated to that argument's value.

## load-db-limit

Definition: `yarn run reset-db && yarn run load-db && psql -d commonwealth -U commonwealth -a -f limited_load.sql`

Description: Used in conjunction with [dump-db-limit](#dump-db-limit), this loads a dumped copy of the commonwealth-beta Heroku database alongside a limited, copied set of Notification and Subscription rows.

## migrate-db

Definition: `npx sequelize db:migrate`

Description: Migrates database, using migration files in `./server/migration` directory.

## migrate-db-down

Definition: `npx sequelize db:migrate:undo`

Description: Undoes the last-run Sequelize migration.

## psql

Definition: `chmod u+x scripts/start-psql.sh && ./scripts/start-psql.sh`

Description: Start a PostgreSQL instance.

## reset-db

Definition: `chmod u+x scripts/reset-db.sh && ./scripts/reset-db.sh`

Description: Resets the local database.

## reset-frack-db

Definition: `heroku pg:copy commonwealth-beta::CW_READ_DB DATABASE_URL --app commonwealth-frack --confirm commonwealth-frack`

Description: Synchronizes `beta-db` (used for QA) against the `frack-db` (used for CDN cache testing). Good for undoing migration script run in previous commit to Frack. See [Testing Environments](./Testing-Environments.md) entry for more info.

## db-doc

Definition: `chmod u+x scripts/gen-mermaid-erd.sh && ./scripts/gen-mermaid-erd.sh > ../../knowledge_base/wiki/Database-ERD.md`

Description: This pulls the schema from a local Postgres instance and generates a Mermaid ERD, updating `/knowledge_base/wiki/Database-ERD.md`

Considerations:

- Using a local PG instance with the default configuration. Developers must ensure it has the latest schema
- Recommended after major database migrations (adding/removing tables/fields/relationships)
- Not integrated (CI) yet, need to review how we incorporate file changes from GH actions back to the repo

Contributor: Roger Torres

# Docker

## start-containers

Definition: `chmod +rx ./scripts/start-docker-containers.sh && ./scripts/start-docker-containers.sh`

Description: Starts remote Docker containers; see [start-docker-containers.sh](../packages/commonwealth/scripts/start-docker-containers.sh) for further documentation.

## start-docker-setup

Definition: `chmod +rx ./scripts/start-docker-setup-help.sh && ./scripts/start-docker-setup-help.sh`

Description: To be run in a new project or repo when first setting up remote docker containers. See [start-docker-setup-help.sh](../packages/commonwealth/scripts/start-docker-setup-help.sh) for further documentation.

# Linting & Formatting

Open considerations: Given our Prettier pre-commit hook, this amount of linting and formatting commands may be unnecessary.

## format

Definition: `prettier --ignore-path ../../.prettierignore --config ../../.prettierrc.json --write .`

Description: Autoformats files using config `prettierrc.json` config.

## lint

Definition: `./scripts/lint-new-work.sh`

Description: Lints new work, according to script file `lint-new-work.sh`.

Considerations: Problematically, only checks .ts files. Name is misleading. Redundancy with [lint-branch](#lint-branch) script. **Flagged for possible removal.**

## lint-all

Definition: `eslint client/\\**/*.{ts,tsx} server/\\**/*.ts`

Description: Only lints changed files on current branch.

Considerations: May be more clearly renamed "lint-changes".

## lint-branch

Definition: `./scripts/lint-branch.sh`

Description: Redundant with [lint](#lint) script, which uses 'git status' instead of 'git diff' but is build toward the same action (isolating changed files for linting).

Considerations: Recommend eliminating either [lint](#lint) or [lint-branch](#lint-branch) scripts. Problematically, lint-branch only checks .ts files. **Flagged for possible removal.**

## lint-branch-warnings

Definition: `FAIL_WARNINGS=1 ./scripts/lint-branch.sh`

Description: Used in the CI. Lints based on the target branch, fails on linter warnings

## style-lint

Definition: `stylelint client/styles/*`

Description: Lints SCSS files.

Considerations: Why lint styles separately? Why not just include `.scss` file extension in [lint](#lint) and [lint-all](#lint-all) scripts (which currently only target `.ts` files)? **Flagged for possible removal.**

# Mobile

## build-android

Definition: `NODE_ENV=mobile webpack --config webpack/webpack.config.mobile.js --progress && NODE_ENV=mobile npx cap sync android`

Description: Uses Capacitor library to build app for Android based on webpack.config.mobile.js file.

Contributor: Dillon Chen

## build-ios

Definition: `NODE_ENV=mobile webpack --config webpack/webpack.config.mobile.js --progress && NODE_ENV=mobile npx cap sync ios`

Description: Uses Capacitor library to build app for iOS based on webpack.config.mobile.js file.

Contributor: Dillon Chen

## open-android

Definition: `NODE_ENV=mobile npx cap open android`

Description: Uses the Capacitor tool to build and run the app's Android project with a simulator.

Contributor: Dillon Chen

## open-ios

Definition: `NODE_ENV=mobile npx cap open ios`

Description: Uses the Capacitor tool to build and run the app's iOS project with a simulator.

Contributor: Dillon Chen

## start-android

Definition: `npx cap run android`

Description: Uses the Capacitor tool to build and run the app's Android project with a simulator.

Contributor: Dillon Chen

## start-ios

Definition: `npx cap run ios`

Description: Uses the Capacitor tool to build and run the app's iOS project with a simulator.

Contributor: Dillon Chen

# Other services

## datadog-db-setup

Definition: `chmod u+x scripts/setup-datadog-postgres.sh && ./scripts/setup-datadog-postgres.sh`

Description: Helper script to complete DataDog Postgres account setup, scripts, and required config. Allows us Heroku database monitoring and stats. See [ReadMe](../packages/commonwealth/README.md) for more information on using DataDog.

Contributor: Nakul Manchanda

## send-cosmos-notifs

Definition: `ts-node --project tsconfig.json server/cosmosGovNotifications/generateCosmosGovNotifications.ts`

Description: Generates Cosmos v1 and v1beta1 governance notifications by polling relevant Cosmos chains.

Contributor: Timothee Legros

## send-notification-digest-emails

Definition: `SEND_EMAILS=true ts-node --project tsconfig.json server.ts`

Description: Schedules a daily task for sending notification email digests.

# Playwright

## e2e-start-server

Definition: `ETH_RPC=e2e-test yarn start`

Description: Starts the app server with the ETH_RPC env variable set to “e2e-test,” to trigger our MockMetaMask provider for wallet testing.

Contributor: Kurtis Assad

## emit-notification

Definition: `ts-node --project tsconfig.json server/scripts/emitTestNotification.ts`

Description: Emits a chain-event or snapshot notification. Run `yarn emit-notification --help` to see options.

Contributor: Timothee Legros

## test-e2e

Definition: `TEST_ENV=playwright npx playwright test -c ./test/e2e/playwright.config.ts --workers 2 ./test/e2e/e2eRegular/*`

Description: Runs Playwright tests using the playwright.config.ts file.

Contributor: Kurtis Assad

## test-e2e-serial

Definition: `TEST_ENV=playwright npx playwright test --workers 1 ./test/e2e/e2eSerial/*`

Description: Runs e2e tests one at a time, to avoid problems of parallel execution.

Contributor: Kurtis Assad

# Testing

Open considerations:

- When and why do we invoke `nyc` and `NODE_ENV=test` in our scripts? No clear rhyme or reason to our use.
  - `nyc` runs IstanbulJS, which tracks and reports how much of our source code is covered by tests. `NODE_ENV=test` sets a global variable that changes how select parts of our wallet and chain infrastructure runs.
- Do we need so many different scripts for specifying which part of the codebase we want to test? Would a generic test script, taking a directory as argument, suffice?
  - See e.g. [test-select](#test-select)
- Any test scripts we remove, we should ensure their respective invocations in `CI.yml` are replaced with appropriate definitions.

## integration-test

Definition: `nyc ts-mocha --project tsconfig.json './test/integration/**/*.spec.ts'`

Description: Runs all tests in our integration folder and its subdirectories.

Considerations: This script breaks our more usual test script syntax, which typically begin with the "test-" prefix followed by the directory tested. We should also keep an eye on similar integration-scoped test scripts; there may be redundancies.

## test

Definition: `nyc ts-mocha --project tsconfig.json './test/**/*.spec.ts'`

Description: Runs all tests in our /test directory.

## test-api

Definition: `NODE_ENV=test nyc ts-mocha --project tsconfig.json './test/integration/api/**/*.spec.ts'`

Description: Runs all tests in the /api subfolder of the /integration directory.

## test-devnet

Definition: `nyc ts-mocha --project tsconfig.json './test/devnet/${TEST_DIR:-.}/**/*.spec.ts'`

Description: Runs all tests in our `/devnet`` folder.

## test-emit-notif

Definition `NODE_ENV=test nyc ts-mocha --project tsconfig.json './test/integration/emitNotifications.spec.ts'`

Description: Runs only the `emitNotifications.spec.ts` test, of the three `/integration`` folder "utils."

## test-integration-util

Definition: `NODE_ENV=test nyc ts-mocha --project tsconfig.json './test/integration/*.spec.ts'`

Description: Runs tests living in the top level of our integration folder, where we house tests that require "integrated" components (e.g. tests that need access to a live Postgres database or a live Redis instance, rather than to the mock Postgres or Redis instances we use in util testing).

Considerations: The script name might misleadingly suggest that this script would pick out specifically the /util subfolder in the /integration directory. Might we be better off moving the three top-level scripts (e.g. databaseCleaner.spec.ts) into a dedicated subfolder, and targeting that?

Contributor: Timothee Legros

## test-select

Definition: `NODE_ENV=test nyc ts-mocha --project tsconfig.json`

Description: Append a path to run specific test files or folders.

## test-suite

Definition: `NODE_ENV=test nyc ts-mocha --project tsconfig.json './test/**/*.spec.ts'`

Description: Runs all tests in our /test directory.

Considerations: This is equivalent to our `test` script but with `NODE_ENV=test` added. Why? Do we actually need both versions? **Flagged for possible removal.**

## unit-test

Definition: `NODE_ENV=test ts-mocha --project tsconfig.json './test/unit/**/*.spec.ts'`

Description: Tests all .spec files within the `./test/unit` sub-directory of test folder.

Considerations: This script breaks our more usual test script syntax, which typically begin with the "test-" prefix followed by the directory tested.

Contributor: Ryan Bennett

## unit-test:watch

Definition: `NODE_ENV=test ts-mocha --project tsconfig.json --opts test/mocha-dev.opts './test/unit/**/*.spec.ts' -w --watch-files '**/*.ts'`

Description: Watches for changes to any .spec files within `./test/unit` and automatically runs test when they are updated.

Considerations: This script breaks our more usual test script syntax, which typically begin with the "test-" prefix followed by the directory tested.

Contributor: Ryan Bennett

# TypeScript

## check-types

Definition: `tsc --noEmit`

Description: Runs a compilation of TypeScript files based on tsconfig.json; does not emit files.

# Webpack && TSNode

## bundle-report

Definition: `webpack-bundle-analyzer --port 4200 build/stats.json`

Description:  Runs webpack-bundle-analyzer library to display breakdown of bundle size & makeup, hosted on port 4200 (localhost:4200). To generate a stats.json file, navigate to [webpack.prod.config.js](../packages/commonwealth/webpack/webpack.prod.config.js), set the `generateStatsFile` key to true, run `yarn build` , and finally `yarn bundle-report`.

## listen

Definition: `RUN_AS_LISTENER=true ts-node --project tsconfig.json server.ts`

Description: Runs ts-node, a TypeScript execution engine for NodeJS, in listening mode for changes, following tsconfig.json and using [server.ts](../packages/commonwealth/server.ts) as the entry file.

## start

Definition: `ts-node-dev --max-old-space-size=4096 --respawn --transpile-only --project tsconfig.json server.ts`

Description: Windows-compatible start script. Used to start the Commonwealth app in development.

## start-all

Definition: `concurrently -p '{name}' -c red,green -n app,consumer 'yarn start' 'yarn start-consumer'`

Description: Runs `yarn start` and `yarn start-consumer` (i.e., the main app server, and the CommonwealthConsumer script) concurrently with the `concurrently` package.

## start-consumer

Definition: `ts-node -r tsconfig-paths/register server/workers/commonwealthConsumer/commonwealthConsumer.ts run-as-script`

Description: Runs `CommonwealthConsumer.ts` script, which consumes & processes RabbitMQ messages from external apps and services. See script file for more complete documentation.

## start-evm-ce

Definition: `ts-node -r tsconfig-paths/register server/workers/evmChainEvents/startEvmPolling.ts`

Description: Runs `startEvmPolling.ts` script, which polls Ethereum chains for events in order to generate notifications.

# Devnets

## cosmos:build

Definition: `chmod u+x test/util/cosmos-chain-testing/v1/start.sh && ./test/util/cosmos-chain-testing/v1/start.sh --build && chmod u+x test/util/cosmos-chain-testing/v1beta1/start.sh && ./test/util/cosmos-chain-testing/v1beta1/start.sh --build && chmod u+x test/util/cosmos-chain-testing/ethermint/start.sh && ./test/util/cosmos-chain-testing/ethermint/start.sh --build`

Description: Fetches Docker images for all Cosmos devnets (evmos, v1beta1, and v1) and starts containers for each.

## cosmos:start

Definition: `chmod u+x test/util/cosmos-chain-testing/v1/start.sh && ./test/util/cosmos-chain-testing/v1/start.sh && chmod u+x test/util/cosmos-chain-testing/v1beta1/start.sh && ./test/util/cosmos-chain-testing/v1beta1/start.sh && chmod u+x test/util/cosmos-chain-testing/ethermint/start.sh && ./test/util/cosmos-chain-testing/ethermint/start.sh`

Description: Starts existing dormant Cosmos devnet containers.

## cosmos:stop

Definition: `chmod u+x test/util/cosmos-chain-testing/v1/stop.sh && ./test/util/cosmos-chain-testing/v1/stop.sh && chmod u+x test/util/cosmos-chain-testing/v1beta1/stop.sh && ./test/util/cosmos-chain-testing/v1beta1/stop.sh && chmod u+x test/util/cosmos-chain-testing/ethermint/stop.sh && ./test/util/cosmos-chain-testing/ethermint/stop.sh`

Description: Stop all Cosmos devnet containers.
