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