# Overview

## Projects
There are 2 projects on Railway:

**Stable Environments**
This project contains all environments which are auto-deployed from GitHub branches. This includes
Frick, Frack, Demo, Beta (QA), and production.

**PR Review Apps**
This project contains all environments deployed from PRs. These are deployed using custom scripts
in [libs/railway](../libs/railway) that interact with the Railway GraphQL API.

Note: On Railway each service deploys independently.

## Configuration

### Stable Environments

Since these environments are deployed from GitHub they naturally have their service configurations
stored in the repo. These are found in the [/deploy](../deploy) directory.

The deployment process is as follows:
1. Push to a branch that has a connected environment (e.g. Frick)
2. Railway clones the branch and detects the `railway.[service].json` file for each service
3. Railway builds the [railway.dockerfile](../railway.dockerfile) Dockerfile for each service
4. Railway runs the [pre-deploy](../packages/commonwealth/server/scripts/pre-deploy.ts) script which
executes triggers a release via the Releaser service. Each deploying service polls the Releaser to
find out if the triggered release succeeded or failed.
5. Railway deploys the built images for each service with 0 downtime if healthchecks and rollouts are configured

### PR Review Apps

Unlike the [Stable Environments](#Stable-Environments), PR environments do not adhere to the configurations defined
in the configuration files. Instead, we have an environment called "Parent Env" which we manually make configuration
changes to. This environment is then forked via the scripts to create the PR environments.

The deployment process is as follows:
1. Open a PR and comment `/deploy` on the PR (alternatively you can manually trigger the 
workflow for a specific PR via GitHub actions)
2. GH will execute the [review_app.yml](../.github/workflows/review_app.yml) action which executes scripts
that fork the "Parent Env", create a new Neon branch, and updates some environment variables in 
the new Railway environment.
3. Once the scripts complete, the GH action will comment on the PR with the URL to the new deployment.
4. Comment `/destroy` or close the PR and GH will execute [destory_review_app.yml](../.github/workflows/destroy_review_app.yml)
to delete the Railway environment and delete the Neon branch.

### Services

#### Redis

The Redis template provided by Railway does not have AOF (disk persistence)
enabled by default. To enable it after deploying the Redis template, delete
the `REDIS_AOF_ENABLED` environment variable.

#### Releaser

The [releaser](https://github.com/timolegros/railway-git-releaser) is a custom Docker image that enables atomic deployments of multiple services
on Railway. For more information on why the Releaser is necessary or how it works,
see the Releaser [README.md](https://github.com/timolegros/railway-git-releaser/blob/main/README.md).

In short, when triggered by a pre-deploy script, the Releaser clones the Commonwealth repo
at the specified commit and executes the [railway-releaser.sh](../scripts/railway-releaser.sh) script.

If the script fails, none of the Railway services will deploy and the previous
deployment will remain active. If the script succeeds, all the Railway services will deploy as one.

At this time, there is no way to re-run a failed release for a specific commit. If a release fails,
you must re-deploy a new commit to trigger a new release.

# New Service in Existing Environment
1. Create an empty service on the Railway dashboard
2. Add all shared variables to the service
3. Add the `SERVICE` environment variable (must match a service from core)
4. Add `RELEASER_API_KEY` and `RELEASER_URL` environment variables to the service e.g.:
    ```
    RELEASER_API_KEY="${{Demo Releaser.API_KEY}}"
    RELEASER_URL="${{Demo Releaser.RELEASER_URL}}"
    ```
5. Set a service name that is unique among all environments in the project (e.g. prefix with env name)
6. In the service settings, specify the path to the railway config as code file, e.g.:
`deploy/railway.web.json`
7. In the service settings, link the commonwealth repo and select a branch to deploy from

### Note

If in the production environment also add Datadog environment variables to the service e.g.:
```
RELEASER_API_KEY="${{Prod Releaser.API_KEY}}"
RELEASER_URL="${{Prod Releaser.RELEASER_URL}}"
```
