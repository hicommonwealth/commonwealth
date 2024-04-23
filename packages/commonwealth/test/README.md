# Testing

## Unit

Unit tests are designed to test business logic without referring to the network or database. The test suite should run
quickly via `pnpm run unit-test`.

**If your tests take long to run, it is likely they are not proper unit tests.** Ensure that you are not
using `test/util/modelUtils.ts`, or that none of the included files import `server/database.ts`.

## Integration

Tests in the integration folder are generally older, and are classed as integration tests because they interact with the
database.
