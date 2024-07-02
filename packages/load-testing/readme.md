# Quickstart

## Testing from local env

### Local API
1. Execute `pnpm start` to start up the required services in Docker.
2. Navigate to `packages/commonwealth` and execute `pnpm db-all` to bootstrap the load test database.
3. Navigate to `packages/commonwealth` and execute `pnpm start` to start the Commonwealth server.
4. Execute `pnpm test test/<path_to_test_file>.ts`

### Remote API
1. Execute `pnpm start <frick | frack | beta>` to start up the required services in Docker and connect them to the
desired Heroku app.
2. Execute `pnpm test test/<path_to_test_file>.ts`

## Testing from K6 Cloud
WIP

# Adding Remote Modules
K6 supports loading some compatible remote modules. A list of compatible modules can be found [here][3]. These modules
generally will not have types, but it may be worth looking for some in the @types repository. If none can be found, it
is recommended to declare the module types in `test/types.d.ts`. If declaring custom types is too complex you can add
`//@ts-ignore` above the import to ignore the type error. More information can be found in the [K6 documentation][4].

# Package Scripts

### start

Definition: `chmod u+x scripts/start.sh && ./scripts/start.sh`

Description: Starts all the required services for running k6 load tests from the local environment. This includes 
Grafana, Prometheus, and the Prometheus-Postgres Exporter. Additionally, if a native local database is not found and a
remote database is not specified, a Postgres container will be created.

### test

Definition: `chmod u+x scripts/k6.sh && ./scripts/k6.sh <path-to-test-file>`

Description: Creates a k6 binary (`load-test/k6`) containing the `xk6-sql` and `xk6-ts` extensions if it does not exist 
and then executes the k6 binary with the provided test file.

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
- There exists an [experimental mode][1] that would allow us to execute Typescript files without using the `xk6-ts`
extension, but the `grafana/xk6:latest` Docker image currently uses version v0.5.0 of `k6` and Typescript support is
only available in [v0.5.2][2] and upwards.


[1]: https://grafana.com/docs/k6/latest/using-k6/javascript-typescript-compatibility-mode/#experimental-enhanced-mode
[2]: https://github.com/grafana/k6/releases/tag/v0.52.0
[3]: https://jslib.k6.io/
[4]: https://k6.io/docs/using-k6/modules/#remote-http-s-modules

