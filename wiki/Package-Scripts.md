_Documentation for [the Commonwealth package.json file](../packages/commonwealth/package.json)._

_Entries with an asterisk have been flagged for removal._

**CONTENTS**
- [Build Scripts](#build-scripts)
  - [build-all](#build-all)
  - [build-app](#build-app)
  - [build-consumer](#build-consumer)
  - [build:css](#buildcss)*
- [CI Scripts](#ci-scripts)
  - [wait-server](#wait-server)
- [Database Scripts](#database-scripts)
  - [db-all](#db-all)
  - [dump-db](#dump-db)
  - [dump-db-limit](#dump-db-limit)
  - [dump-db-local](#dump-db-local)
  - [migrate-db](#migrate-db)
  - [migrate-db-down](#migrate-db-down)
  - [migrate-server](#migrate-server)
- [Mobile](#mobile)
  - [build-android](#build-android)
  - [build-ios](#build-ios)
  - [open-android](#open-android)
  - [open-ios](#open-ios)
  - [start-android](#start-android)
  - [start-ios](#start-ios)
- [Other Services](#other-services)
  - [compress-images](#compress-images)*
- [Storybook](#storybook)
  - [storybook](#storybook-1)
  - [build-storybook](#build-storybook)*
- [Testing](#testing)
  - [unit-test](#unit-test)
  - [unit-test:watch](#unit-testwatch)
- [TSNode](#tsnode)
  - [listen](#listen)
  - [start](#start)
  - [sync-entities](#sync-entities)
- [Webpack](#webpack)
  - [bundle-report](#bundle-report)
  - [profile](#profile)

# Build Scripts

## build-all

Definition: `NODE_OPTIONS=--max_old_space_size=4096 webpack --config webpack/webpack.prod.config.js --progress && yarn build-consumer`

Description: Builds app based on webpack.prod.config.js file, as well as the build-consumer script

Considerations: Eliminate redundancy by invoking [build-app](#build-app) in definition.

## build-app
    
Definition: `NODE_OPTIONS=--max_old_space_size=4096 webpack --config webpack/webpack.prod.config.js --progress`

Description: Builds project, allocating max 4096MB memory to Node; runs webpack based on webpack.prod.config.js file.

## build-consumer

Definition: `tsc --project ./tsconfig.consumer.json && tsc-alias --project ./tsconfig.consumer.json`

Description: Runs a compilation based on tsconfig.consumer.json; does not emit files; replaces alias with relative paths post-compilation.

## build:css

_Deprecated; recommend for removal._

Definition: `NODE_ENV=production build client/styles/shared.scss` 

Considerations: Why do we have a separate CSS build? Who uses it? And does it even work? We don't appear to have a `build` command that it could modify.
    
## heroku-postbuild

Definition: `NODE_OPTIONS=--max-old-space-size=$(../../scripts/get-max-old-space-size.sh) webpack --config webpack/webpack.prod.config.js --progress && yarn build-consumer`

Description: Builds project on Heroku, using get-max-old-space-size.sh to dynamically allocate memory; runs webpack and build-consumer script

# CI Scripts

## wait-server

Definition: `chmod +x ./scripts/wait-server.sh && ./scripts/wait-server.sh`

Description: Used for CI. Waits for the server to be ready (start serving on port 8080)

Contributor: Kurtis Assad

# Database Scripts

## db-all

Definition: `yarn reset-db && yarn load-db && yarn migrate-db`

Description: Resets, loads, and migrates db (composite script).

Contributor: Kurtis Assad

## dump-db-local

Definition: ` pg_dump -U commonwealth --verbose --no-privileges --no-owner -f local_save.dump`

Description: Exports local database to a dump file, `local_save.dump`.

## load-db 

Definition: `chmod u+x scripts/load-db.sh && ./scripts/load-db.sh`

Description: Loads database following the `load-db.sh` script. Looks for dump file `latest.dump` by default; if script is called with an argument, the value of DUMP_NAME will be updated to that argument's value.

Considerations: Should we reconcile various dump names in different scripts to be consistent?

## load-db-local

Description: Loads local database from a dump file, `local_save.dump`.

Definition: `psql -d commonwealth -U commonwealth -W -f local_save.dump`

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

Description: Synchronizes `beta-db` with `frack-db`. Good for undoing migration script run in previous commit to frack.

Considerations: Clarify documentation.

# TypeScript

## check-types

Definition: `tsc --noEmit`

Description: Runs a compilation of TypeScript files based on tsconfig.json; does not emit files.

# Linting & Formatting

## format

Definition: `prettier --ignore-path ../../.prettierignore --config ../../.prettierrc.json --write .`

Description: Autoformats files using config file prettierrc.json

## lint

Definition: `./scripts/lint-new-work.sh`

Description: Lints new work, according to script file `lint-new-work.sh`. 

Considerations: Problematically, only checks .ts files. Name is misleading. Redundancy with [lint-branch](#lint-branch) script.

## lint-all

Definition: `eslint client/\\**/*.{ts,tsx} server/\\**/*.ts`

Description: Only lints changed files on current branch. 

Considerations: May be better renamed "lint-changes"

## lint-branch

Definition: `./scripts/lint-branch.sh`

Description: Redundant with [lint](#lint) script, which uses 'git status' instead of 'git diff' but is build toward the same action (isolating changed files for linting).

Considerations: Recommend eliminating either [lint](#lint) or [lint-branch](#lint-branch) scripts. Problematically, lint-branch only checks .ts files.

## style-lint

Definition: `stylelint client/styles/*`

Description: Lints SCSS files.

Considerations: Why lint styles separately? Why not just include .scss file extension in [lint](#lint) and [lint-all](#lint-all) scripts (which currently only target .ts files)?

# Playwright

## gen-e2e

Definition: `npx playwright codegen`

Description: Starts Playwright's test generation feature. This will open up a browser window and allow developers to click around on-screen and autogenerate Playwright code according to actions performed. [Loom example](https://www.loom.com/share/b1b36c7d7fae4b079b380ec2a61da25c)

Contributor: Kurtis Assad

## test-e2e

Definition: `TEST_ENV=playwright npx playwright test ./test/e2e/*`

Description: Runs Playwright tests.

Contributor: Kurtis Assad

# Mobile

_Open question: Are these still in use?_

## build-android 

Definition: `NODE_ENV=mobile webpack --config webpack/webpack.config.mobile.js --progress && NODE_ENV=mobile npx cap sync android`

Description: Uses Capacitor library to build app for Android based on webpack.config.mobile.js file.

Contributor: Dillon Chen

## build-ios

Definition: `NODE_ENV=mobile webpack --config webpack/webpack.config.mobile.js --progress && NODE_ENV=mobile npx cap sync ios`

Description: Uses Capacitor library to build app for iOS based on webpack.config.mobile.js file.

Contributor: Dillon Chen

## open-ios

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

## compress-images

_Deprecated, recommend removal._

# Storybook

## storybook

Definition: `storybook dev -p 6006`

Description: Compiles and serves a development build of Storybook reflecting source code changes in-browser in real time, at localhost:6006.

Contributor: Daniel Martins

## build-storybook

_Deprecated, recommend removal._

Definition `storybook build`

Description:  Compiles Storybook instance for deployment.

Contributor: Daniel Martins

# Testing

## unit-test

Definition: `NODE_ENV=test ts-mocha --project tsconfig.json './test/unit/**/*.spec.ts'`

Description: Tests all .spec files within the `./test/unit` sub-directory of test folder.

Contributor: Ryan Bennett

## unit-test:watch

Definition: `NODE_ENV=test ts-mocha --project tsconfig.json --opts test/mocha-dev.opts './test/unit/**/*.spec.ts' -w --watch-files '**/*.ts'`

Description: Watches for changes to any .spec files within `./test/unit` and automatically runs test when they are updated.

Contributor: Ryan Bennett

# TSNode

## listen

Definition: `RUN_AS_LISTENER=true ts-node --project tsconfig.json server.ts`

Description: Runs ts-node, a TypeScript execution engine for NodeJS, in listening mode for changes, following tsconfig.json and using [server.ts](../packages/commonwealth/server.ts) as the entry file.

## start

Definition: `ts-node-dev --max-old-space-size=4096 --respawn --transpile-only --project tsconfig.json server.ts`

Description: Used to start the Commonwealth app in development. Runs both the backend and frontend server.

Considerations: Follow up with Kurtis; see #2247

## sync-entities

Definition: `ts-node server/scripts/enforceDataConsistency.ts run-as-script $(heroku config:get DATABASE_URL -a chain-events)`

Description: See full documentation in [enforceDataConsistency.ts](../packages/commonwealth/server/scripts/enforceDataConsistency.ts).

# Webpack

## bundle-report    

Definition: `webpack-bundle-analyzer --port 4200 build/stats.json`
    
Description:  Runs webpack-bundle-analyzer library to display breakdown of bundle size & makeup, hosted on port 4200 (localhost:4200). To generate a stats.json file, navigate to [webpack.prod.config.js](../packages/commonwealth/webpack/webpack.prod.config.js), set the `generateStatsFile` key to true, run `yarn build` , and finally `yarn bundle-report`.

## profile 

Definition: `NODE_OPTIONS=--max_old_space_size=4096 webpack --config webpack/webpack.dev.config.js --json --profile > webpack-stats.json`

Description: Runs build webpack analyzer. 

Considerations: Deprecated; recommend removal. Appears to be redundant with `bundle-report`. As of 22-08-03 #all-eng conversation, appears to be unused. See also [stats.sh](../packages/commonwealth/stats.sh) for possible removal.


# Undocumented & in-progress




// TESTING
"test-client": "webpack-dev-server --config webpack/webpack.config.test.js",
"test-events": "nyc ts-mocha --project tsconfig.json ./test/integration/events/*.spec.ts",
"integration-test": "nyc ts-mocha --project tsconfig.json ./test/integration/**/*.spec.ts",
"test-devnet": "nyc ts-mocha --project tsconfig.json ./test/devnet/**/*.spec.ts",
"test-query": "ts-node server/scripts/testQuery.ts",
"test": "nyc ts-mocha --project tsconfig.json ./test/**/*.spec.ts",
"test-emit-notif": "NODE_ENV=test nyc ts-mocha --project tsconfig.json ./test/integration/emitNotifications.spec.ts",
"test-select": "NODE_ENV=test nyc ts-mocha --project tsconfig.json",
"test-api": "NODE_ENV=test nyc ts-mocha --project tsconfig.json ./test/integration/api/**/*.spec.ts",
"test-suite": "NODE_ENV=test nyc ts-mocha --project tsconfig.json ./test/**/*.spec.ts",
"test-consumer": "ts-mocha --project tsconfig.json test/systemTests/consumer.test.ts --timeout 20000",
"test-scripts": "ts-mocha --project tsconfig.json test/integration/enforceDataConsistency.spec.ts",




"start-consumer": "ts-node --project ./tsconfig.consumer.json server/CommonwealthConsumer/CommonwealthConsumer.ts run-as-script",
"start-prerender": "ts-node --project tsconfig.json server/scripts/runPrerenderService.ts",
"start-all": "concurrently -p '{name}' -c red,green -n app,consumer 'yarn start' 'yarn start-consumer'",

"send-notification-digest-emails": "SEND_EMAILS=true ts-node --project tsconfig.json server.ts",
"migrate-server": "heroku run npx sequelize db:migrate --debug",
"start-ci": "FETCH_INTERVAL_MS=500 ts-node --project tsconfig.json server.ts",


// Export heroku db from dump (ask Nakul or other for rationale on flags)
"dump-db": "pg_dump $(heroku config:get CW_READ_DB -a commonwealth-beta) --verbose --exclude-table-data=\"public.\\\"Subscriptions\\\"\" --exclude-table-data=\"public.\\\"Sessions\\\"\" --exclude-table-data=\"public.\\\"DiscussionDrafts\\\"\" --exclude-table-data=\"public.\\\"LoginTokens\\\"\" --exclude-table-data=\"public.\\\"Notifications\\\"\" --exclude-table-data=\"public.\\\"SocialAccounts\\\"\" --exclude-table-data=\"public.\\\"Webhooks\\\"\" --exclude-table-data=\"public.\\\"NotificationsRead\\\"\" --no-privileges --no-owner -f latest.dump",
"datadog-db-setup": "chmod u+x scripts/setup-datadog-postgres.sh && ./scripts/setup-datadog-postgres.sh",


//ADDED BY TIMOTHEE
"create-migration": "npx sequelize migration:generate --name",
"dump-db-limit": "yarn run dump-db &&  psql $(heroku config:get CW_READ_DB -a commonwealth-beta) -a -f limited_dump.sql",
"load-db-limit": "yarn run reset-db && yarn run load-db && psql -d commonwealth -U commonwealth -a -f limited_load.sql",
"start-docker-setup": "chmod +rx ./scripts/start-docker-setup-help.sh && ./scripts/start-docker-setup-help.sh",
"start-containers": "chmod +rx ./scripts/start-docker-containers.sh && ./scripts/start-docker-containers.sh",
"stop-containers": "chmod +rx ./scripts/stop-docker-containers.sh && ./scripts/stop-docker-containers.sh",


// ADDED BY KURTIS
"sync-entities-local": "ts-node server/scripts/enforceDataConsistency.ts run-as-script 'postgresql://commonwealth:edgeware@localhost/commonwealth_chain_events'",
"wait-server": "chmod +x ./scripts/wait-server.sh && ./scripts/wait-server.sh",

