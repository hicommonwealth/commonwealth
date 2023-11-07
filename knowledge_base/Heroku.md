# Heroku

Engineers should be assigned Heroku permissions during the onboarding process. If this is not the case, reach out to an engineering lead.

## Apps

As of 231107, eight apps are hosted on Heroku:

- commonwealth-frack-eu
- cosmos-devnet
- cosmos-devnet-beta
- cw-discourse-import
- evmos-devnet
- snapshot-listener
- commonbot
- common-app

### Common-app

Common-app consists of `commonwealth-beta`, `demo`, `experimental`, `frick`, and `frack` servers.

The commonwealth-demo server is used by the Design and Product Teams to validate engineer work and provide feedback before merging deploying it to the livesite.

The commonwealth-experimental branch is used to host Common 2.0 development.

Frack is a standalone raw Common instance that doesn't interact with other services; it is used for testing pure UI.

Frick is a full Common instance used for testing bots, chain events, and connected services.

The #eng-infra channel is used to communicate which servers are free for testing, and which PRs each is presently pegged to.

### Common-bot

The common-bot app includes the `discobot-listener-staging`, `farcaster-bot-experimental`,
and `discobot-listener` servers.

## Procfiles and Buildpacks

procfile: for defining resources, new workers, new app. dynos are defined by procfile.
add-ons, however, have to be added via dashboard
list of add-ons for production path?
CloudAMQP
Heroku Data for Redis

- BRONZE, COPPER, TEAL
Heroku Postgres
Heroku Scheduler
Hosted Graphite
<https://devcenter.heroku.com/articles/procfile> --- procfile docs
release phase is where migrations are executed. it comes before a new version of the app is deployed (before the dynos of an app go live). you need to trigger a re-release for the migrations to run. one way to force a re-release is to create a new temporary environmental variables.
<https://devcenter.heroku.com/articles/release-phase>
<https://devcenter.heroku.com/articles/git>
Buildpacks: scripts that run when app is deployed

## Downloading Production Databases

To download and restore the production database, run the following package scripts:

```bash
yarn dump-db

yarn load-db
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

- 231031: Split off by Graham Johnson from `commonwealth/README.md`. Flagged for overhaul.
