## Scripts

### [createParentReviewApp.ts](src/scripts/createParentReviewApp.ts)

Usage: `tsx createParentReviewApp.ts --commit=[commit-SHA]`

This script creates the parent environment from which all review apps are eventually forked
off of. This should only be used in the initial set up phase of review apps or in extreme
circumstances when debugging. Its use is mainly as a reference for the services and service
settings that the parent environment should contain.

Note that some manual steps are still required:
- Import environment variables from Heroku and set appropriate APP_ENV (and other env var)

### [deployReviewApp.ts](src/scripts/deployReviewApp.ts)

Usage: `pnpm deploy-review-app --env=[env-name] --commit=[commit-SHA]`

This script creates a fork of the parent environment (variables, services, etc) and deploys
the Docker images specified by the commit SHA. This script expects that Docker images for the
provided commit SHA are published at `ghcr.io/hicommonwealth/{serviceName}:{commitSHA}`.

Notably, this script accepts an optional `--db-url` argument. If you are creating a
brand-new review app you should set this to the Neon branch db url to be used with this new app. 
If the review environment/app already exists then you may omit providing the url in order to only
update the Docker images that are deployed.

### [upsertEnvVariables.ts](src/scripts/upsertEnvVariables.ts)

Usage: `pnpm upsert-env-var --env=[env-name] --env-var KEY=value KEY2=value2`

This script inserts or updates the environment variables in the specified environment.





