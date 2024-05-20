# Heroku

Engineers should be assigned Heroku admin permissions during the onboarding process. If this is not the case, reach out to an engineering lead.

## Contents

- [Apps](#apps)
  + [Common-app](#common-app)
  + [Common-bot](#common-bot)
- [Procfiles](#procfiles)
- [Buildpacks](#buildpacks)
- [Release phases](#release-phases)
- [Downloading Production Databases](#downloading-production-databases)
- [Change Log](#change-log)

## Apps

As of 231107, eight apps are hosted on Heroku:

1. `common-app`
2. `commonbot`
3. `commonwealth-frack-eu`
4. `cosmos-devnet`
5. `cosmos-devnet-beta`
6. `cw-discourse-import`
7. `evmos-devnet`
8. `snapshot-listener`

### Common-app

The `common-app` comprises several sub-apps or servers:

1. `commonwealth-beta`: used in the engineering QA process.
2. `commonwealth-demo`: used by the Design and Product Teams to validate engineer work and provide feedback before merging deploying it to the livesite.
3. `commonwealth-experimental`: used to host Common 2.0 development.
4. `commonwealth-frick`: a full Common instance used for testing bots and connected services.
5. `commonwealth-frack`: a standalone raw Common instance (including chain events) that doesn't interact with other services; it is used for testing migrations, API, and UI.

The #eng-infra Slack channel is used to communicate which servers are free for testing, and which PRs each sever is presently pegged to.

For more complete information on our testing environments, and instructions on updating the #eng-infra channel topic, see the dedicated [Testing Environments](./Testing-Environments.md) entry.

### Common-bot

The common-bot app several sub-apps or servers:

1. `discobot-listener`: Handles Commonwealth <> Discord integration. For full documentation, see [Discobot.md](./Discobot.md).
2. `discobot-listener-staging`: A testing server for Discobot.
3. `farcaster-bot-experimental`: An in-progress Common 2.0 project.

## Procfiles

Heroku procfiles are used to specify the processes (workers, dynos, resources) executed by an app on startup. Processes of the "release" type are run during the [release phase](#release-phases). See [dedicated Heroku documentation](https://devcenter.heroku.com/articles/procfile) for a more detailed guide.

Common currently uses a multi-procfile setup, which also entails a multi-procfile buildpack. See [the relevant GitHub repo ReadMe](https://github.com/heroku/heroku-buildpack-multi-procfile) for more information.

## Buildpacks

A buildpack is a collection of scripts which collectively transform deployed code into slugs, to be executed on a dyno. See [dedicated Heroku documentation](https://devcenter.heroku.com/articles/buildpacks) for a more detailed guide.

## Release phases

The release phase allows processes (e.g. database migrations) to run prior to the deployment of a new app version. A re-release may need to be triggered for migrations to run; one way to force a re-release is to create a new temporary environment variable. Rollbacks, pipeline promotions, and the provisioning of new add-ons may also be used to trigger a release. See [dedicated Heroku documentation](https://devcenter.heroku.com/articles/release-phase) for a more detailed guide.

## Downloading Production Databases

To download and restore the production database, run the following package scripts:

```bash
pnpm dump-db

pnpm load-db
```

To access the production DB, run:

```bash
heroku pg:psql
```

To copy the production database to the staging database for testing purposes, ensuring migrations will work:

1. Turn off the web dynos in staging:

    ```bash
    heroku maintenance:on -a <STAGING_APP>
    ```

2. Backup the staging database in case of an error:

    ```bash
    heroku pg:backups capture -a <STAGING_APP>
    ```

3. Copy the db from the production app database url to staging url:

    ```bash
    heroku pg:copy <PRODUCTION_APP>::<PRODUCTION_DB_URL> <STAGING_DB_URL> -a <STAGING_APP>
    ```

4. Turn on the web dynos in staging:

    ```bash
    heroku maintenance:off -a <STAGING_APP>
    ```

## Change Log

- 231127: Apps and Procfile sections added by Graham Johnson in consultation with Timothee Legros.
- 231031: Split off by Graham Johnson from `commonwealth/README.md`. Flagged for overhaul.
