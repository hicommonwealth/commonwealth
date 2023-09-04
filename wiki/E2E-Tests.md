## Overview
E2e tests are tests that are ran as if the user was clicking around on the webpage. E2e tests are written in the
playwright framework.

## Running e2e tests
### Locally
To run e2e tests locally you need to first run `e2e-start-server`. When the server is ready run `test-e2e`.
* e2e-start-server - Starts the server and injects a mocked metamask object. It allows you to have a default
metamask account without needing to have the metamask extension installed.
* test-e2e - Runs playwright on all the tests in the e2e folder.

### on CI
Because we can not be there to manually check if the server had started, we rely on the `wait-server` to wait for
the server to be ready before we run the `test-e2e`.

## Writing e2e Tests
### File Structure
Tests are broken down as follows:
#### Folder level
* e2eStateful - This relies on the DB to be set up with a dump of the test entities
* e2eSerial - The tests in this suite will be run in serial (Avoids race conditions)
* e2eRegular - The tests in this suite are set up with a default empty DB (need to make your own test entities) as well as being run in parallel.

#### File level
Each file should represent only one route. See for example discussions.spec.ts. This file should only ever navigate
to /discussions.

## Debugging e2e Tests
When e2e tests fail we record a video of the failed run.

* Locally - These video is stored in the test-results folder. They are named after the name of the test that failed
and produced it.
* CI - These videos are stored in the artifacts. They can be found and downlaoded at the bottom of the summary page

## Mature e2e test detection
Due to the complex nature of e2e tests, often times they are flaky. Flaky tests reduces our confidence that the test
itself has captured and surfaces an issue when it fails. In theory, the best way to solve this, is to ensure that the
e2e tests themselves are not flaky. Sometimes this is not feasible (For example, if a test is flaky 1/20 times, it will
be difficult to know that it is flaky in the first place). In order to prevent this loss of confidence, but still be
able to run tests to determine if they are flaky, we have come up with the regular/mature e2e suites.

The way this works is the following. We have a script called detectMatureE2e.ts. It is run on the CI on push to master.
It checks the latest test runs, and tracks its failures in the [AUXILLARY_DATABASE](wiki/Database.md). After a certain
period of time, it takes these test that have not failed, and puts them in the mature e2e suite, which is then required
on merge.