# Quickstart

1. Execute `pnpm start` to start up the required services in Docker.
2. Navigate to `packages/commonwealth` and execute `pnpm db-all` to bootstrap the load test database.
3. Navigate to `packages/commonwealth` and execute `pnpm start` to start the Commonwealth server.
4. Execute `pnpm test test/<path_to_test_file>.ts`

# Package Scripts

### start

Definition: `docker compose -f monitoring.yaml`

Description: Starts all the required services for running k6 load tests locally. This includes Grafana, Prometheus, and
Postgres.

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

# Notes

- There exists an [experimental mode][1] that would allow us to execute Typescript files without using the `xk6-ts`
extension, but the `grafana/xk6:latest` Docker image currently uses version v0.5.0 of `k6` and Typescript support is
only available in [v0.5.2][2] and upwards.

# TODO

- We allow for a `SERVER_URL` to be defined but not a `DATABASE_URL` that is associated to the `SERVER_URL`

[1]: https://grafana.com/docs/k6/latest/using-k6/javascript-typescript-compatibility-mode/#experimental-enhanced-mode
[2]: https://github.com/grafana/k6/releases/tag/v0.52.0

