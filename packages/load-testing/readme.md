# Installation

These steps are required for local development and execution of k6 tests.

Install k6 v0.51.0 in your local environment. See the [K6 docs][1] for instructions. Note that the version is important
because the k6 types package is installed with PNPM and set to version 0.51.0.

# Quickstart

1. Execute `pnpm start` to start up the required services in Docker.
2. Navigate to `packages/commonwealth` and execute `pnpm db-all` to bootstrap the load test database.
3. Navigate to `packages/commonwealth` and execute `pnpm start` to start the Commonwealth server.
4. Execute `pnpm build` to build the tests. K6 can only execute Javascript tests.
5. Execute either `pnpm test-api:local` or `pnpm test-browser:local` to run tests.

# Package Scripts

### build

Definition: `tsc -b ./tsconfig.json && tsc-alias -p ./tsconfig.json`

Description: This builds the files in the `test` directory and outputs them in the `build` directory.

Considerations: K6 can only run JavaScript files so changes must always be built before running the tests.

### test-browser-local

Definition: `k6 -e BASE_URL=localhost:8080 run build/browser/*.spec.js`

Description: Executes the compiled browser tests from `build/browser` in the local environment.

Considerations: Requires Grafana, Prometheus, Postgres, and the Commonwealth app to be running. See [start](#start).
Also requires k6 to be installed (see [Installation](#Installation))

### test-api-local

Definition: `k6 run build/api/*.spec.js`

Description: Executes the compiled API tests from `build/api` in the local environment.

Considerations: Requires Grafana, Prometheus, Postgres, and the Commonwealth app to be running. See [start](#start).
Also requires k6 to be installed (see [Installation](#Installation))


### start

Definition: `docker compose -f monitoring.yaml`

Description: Starts all the required services for running k6 load tests locally. This includes Grafana, Prometheus, the
Commonwealth app, and Postgres.

