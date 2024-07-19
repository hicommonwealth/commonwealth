# Quickstart

## Testing from local env

### Local API
1. Execute `pnpm start` to start up the required services in Docker.
2. Navigate to `packages/commonwealth` and execute `pnpm db-all` to bootstrap the load test database.
3. Navigate to `packages/commonwealth` and execute `pnpm start` to start the Commonwealth server.
4. Execute `pnpm test test/<path_to_test_file>.ts`
  - This executes load tests against your local API with the 'dev' scenario.

### Remote API
1. Execute `pnpm start <frick | frack | beta>` to start up the required services in Docker and connect them to the
desired Heroku app.
2. Execute `pnpm test test/<path_to_test_file>.ts -a <frick | frack | beta>`

## Testing Remote API from K6 Cloud
To use native k6 on the cloud you must first execute `k6 login cloud -token [K6_CLOUD_PERSONAL_TOKEN]`. To use k6 on the
cloud via Docker you must set the K6_CLOUD_PERSONAL_TOKEN in your root `.env` file. Starting the Docker services is not
necessary since all the metrics will be hosted on the k6 cloud.

1. Execute `pnpm start <frick | frack | beta>` to start up the required services in Docker and connect them to the
   desired Heroku app.
2. Execute `pnpm test test/<path_to_test_file>.ts -a <frick | frack | beta> -c`

# Best Practices
## Adding Remote Modules
K6 supports loading some compatible remote modules. A list of compatible modules can be found [here][3]. These modules
generally will not have types, but it may be worth looking for some in the @types repository. If none can be found, it
is recommended to declare the module types in `test/types.d.ts`. If declaring custom types is too complex you can add
`//@ts-ignore` above the import to ignore the type error. More information can be found in the [K6 documentation][4].

## Test Organization and Creation
To keep tests organized/robust and help with visualizing, sorting, and filtering test results in Grafana use the 
following patterns/strategies when creating load tests:
- Define API request functions in `test/util/apiRequests` and then use those functions to create a test.
- Use [k6 stages][5] and [stage tagging][6] to simulate ramping up of load and to enable filtering metrics over stages.
- Use [k6 Groups][1] to tag related requests (e.g. a group for all requests originating from a single browser page).
  - Don't use a Group for a single request. See the [docs][2] for reasoning.
- Use [k6 user-defined tags][7] to tag related requests even if they are in different groups e.g. Thread creation <> Comment creation.
- Use [k6 scenarios][8] to simulate different workloads for the same test.
- ~~Use [k6 SharedArrays][9] to store different JWTs for every virtual user. This ensures that each VU test cycle triggers 
queries to different data in the database thus simulating a real world scenario. If all virtual users use the same JWT,
performance results will be biased since the database can cache the specific data that is queried repeatedly.~~ Edit:
Setting up shared arrays in `setup` lifecycle functions is not supported. Return the result of the `createJWTs` function 
from the `setup` function which is accessible (copied to each VU on first iteration) as the first argument of test
functions. See [this GitHub issue][12] for more info.

## Creating API Request Functions
- Use `k6/http` not Axios or the native node `http` module.
- k6 currently doesn't natively support ignoring metrics for HTTP requests from `setup` and `teardown` functions (see
[this GitHub Issue][10] for context) but there is a workaround described [here][11]. To use this workaround, ensure that
any tests that make HTTP requests in setup or teardown functions have an options object that extend the 
`IgnoreLifecycleMetrics` configuration.
- Use `check` functions to ensure requests were successful.

# Generating Tests from OpenAPI Spec
Execute the `generate-load-tests` command from the root of the repository to generate a javascript load test in
`/packages/load-testing/generated-load-test`. Note that this Javascript test must be converted to Typescript and
thoroughly updated to fit the desired testing scenarios. Indeed, this generator script should only be used to generate
the general outline of utility request functions in `load-testing/test/apiRequests/`. This script has limited utility.

# Load Test Scenarios
Each k6 load test can be executed with 3 different preconfigured scenarios. To specify a scenario when running a test,
use the `-s <dev | constant | spike>` option. The default scenario (if unspecified) is `dev`. More information can be 
found in `test/util/scenarios.ts`.

### dev
This scenario is a fast test which runs a set number of iterations (defaults to 100) in maximum 30 seconds. 
This scenario can only be used when running tests from a local environment (but can be run against remote apps). This
scenario should only be used to get a quick and dirty estimate of RPS during development.

### constant
This scenario is a medium-length test which makes API requests at a constant rate regardless of the performance of the
API (open-model). This is the best scenario to execute to get an accurate measure of the RPS under stable load.

### spike
This scenario is a long-running test which ramps the number of requests generated up then down to simulate a temporary
spike in traffic. This test should be used to determine API performance under short bouts of extreme load.

# Package Scripts

### start

Definition: `chmod u+x scripts/start.sh && ./scripts/start.sh`

Description: Starts all the required services for running k6 load tests from the local environment. This includes 
Grafana, Prometheus, and the Prometheus-Postgres Exporter. Additionally, if a native local database is not found and a
remote database is not specified, a Postgres container will be created.

### test-load

Definition: `chmod u+x scripts/k6.sh && ./scripts/k6.sh`

Description: Use `pnpm test-load --help` to see available options. The script executes a specified Typescript k6 load 
test using Docker against a specified app environment.

Considerations: Executing load tests with Docker is less performant than executing them with a native k6 installation
(see [test-load-native](#test-load-native)). Requires Grafana, Prometheus, Postgres, and the Commonwealth app to be running. 
See [start](#start).

### test-load-native

Definition: `chmod u+x scripts/k6.sh && NATIVE_K6=true ./scripts/k6.sh`

Description: Use `pnpm test-load --help` to see available options. The script executes a specified Typescript k6 load 
test using a native/local k6 installation against a specified app environment.

Considerations: Requires Grafana, Prometheus, Postgres, and the Commonwealth app to be running. See [start](#start).

### clean

Definition: `sudo rm -rf db && rm -rf grafana && rm -rf k6`

Description: Cleans up all files and directories that are not committed with git.

Considerations: This command should not be run on a regular basis like `clean` scripts in other packages. Removing the 
k6 binary means it needs to be rebuilt the next time you execute a test. Additionally, the db and  grafana directories 
cannot be removed if the Docker containers are running. `sudo` is required for removing the `db` directory because it
is created by a Docker instance with root access.

### stop

Definition: `docker compose -f monitoring.yaml down`

Description: Stops and removes all Docker containers created in the [start](#start) script.

### check-types

Definition: `tsc --noEmit`

Description: Checks the types of `/test` and `/src`.

# Notes

- Explicitly `async` test lifecycle functions are not supported by k6. To implement k6 async functionality use callback
syntax as described here: https://github.com/grafana/k6/issues/2935#issuecomment-1443462207.
- Open and closed model scenarios refers to different executors: 
https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/

# Tracking Issues
- [SharedArray Improvements][12]
- https://github.com/grafana/k6/issues/1342
- https://community.grafana.com/t/sequentially-run-scenarios/99153/6

[1]: https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/#groups
[2]: https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/#discouraged-one-group-per-request
[3]: https://jslib.k6.io/
[4]: https://k6.io/docs/using-k6/modules/#remote-http-s-modules
[5]: https://k6.io/docs/get-started/running-k6/#stages-ramping-up-down-vus
[6]: https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/#tagging-stages
[7]: https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/#user-defined-tags
[8]: https://grafana.com/docs/k6/latest/using-k6/scenarios/
[9]: https://grafana.com/docs/k6/latest/javascript-api/k6-data/sharedarray/
[10]: https://github.com/grafana/k6/issues/1321
[11]: https://community.grafana.com/t/ignore-http-calls-made-in-setup-or-teardown-in-results/97260/2
[12]: https://github.com/grafana/k6/issues/2043