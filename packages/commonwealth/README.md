# Commonwealth

Commonwealth is an all-in-one platform for on-chain communities to discuss, vote, and fund projects together.

## Table of Contents

- [Quickstart](#quickstart)
  * [Dependency installation](#dependency-installation)
    + [Postgres](#postgres)
    + [RabbitMQ (optional)](#rabbitmq--optional-)
    + [nvm](#nvm)
    + [M1 Mac Troubleshooting](#m1-mac-troubleshooting)
- [Environment Variables](#environment-variables)
- [Production Database](#production-database)
- [Custom Domains](#custom-domains)
- [Datadog Monitoring on Heroku](#datadog-monitoring-on-heroku)
  * [Helpful guides](#helpful-guides)
  * [Prerequisites](#prerequisites)
  * [Verify on Datadog](#verify-on-datadog)
  * [Datadog - Dashboard](#datadog---dashboard)

## Quickstart

Clone the repository:

```bash
git clone https://github.com/hicommonwealth/commonwealth.git
```

### Dependency installation

#### Docker

To install dependencies, install 

#### Postgres

Run the following commands in bash:

```bash
brew install node yarn postgresql

brew services start postgresql

psql postgres -c "CREATE ROLE commonwealth WITH LOGIN PASSWORD 'edgeware'; ALTER ROLE commonwealth SUPERUSER;"

psql postgres -h 127.0.0.1 -U commonwealth -c "CREATE DATABASE commonwealth;"
```

This should give you a Postgres server installed and running with user `commonwealth` and password `edgeware`.

## Environment Variables

You should create a `.env` file at the `package/commonwealth` level to store minimum security environment variables. Higher security secrets should be stored inside an `.auth` file.

If you are not using backend storage of chain events, we recommend running with NO_EVENTS=true to reduce load on your dev computer, and reduce the number of possible errors you might run into.

Environment variables used for external services include:

- AWS_ACCESS_KEY_ID: for uploading images to Amazon S3
- AWS_SECRET_ACCESS_KEY: for uploading images to Amazon S3
- AWS_REGION: for uploading images to Amazon S3 (conventionally 'us-east-1')
- GITHUB_CLIENT_ID: for Github OAuth login
- GITHUB_CLIENT_SECRET: for Github OAuth login
- MIXPANEL_TOKEN: for analytics
- ROLLBAR_SERVER_TOKEN: for error reporting
- SENDGRID_API_KEY: for sending emails, email login, etc.
- NODE_URL: for server-side proposal archiving (usually ws://testnet2.edgewa.re:9944, may be deprecated soon)
- DATABASE_URL (set by Heroku)
- JWT_SECRET
- SESSION_SECRET
- MAGIC_API_KEY
- MAGIC_SUPPORTED_BASES
- MAGIC_DEFAULT_CHAIN
- COSMOS_GOV_V1
- DISCORD_CLIENT_ID: for Discord OAuth login
- DISCORD_CLIENT_SECRET: for Discord OAuth login
- DISCORD_OAUTH_SCOPES: scopes (usually just 'identify')
- PGPASSWORD: [OPTIONAL] avoids the password prompt for all local database commands
- ETH_ALCHEMY_API_KEY: [OPTIONAL] if set, the load-db commands will replace production Alchemy urls with their locally supported variants

- NO_CLIENT: set to true to disable the front-end build

## Production Database

<!-- Break off into docs for internal: This is Heroku API documentation. The only command we use is heroku pg copy. Add documentation to get our Heroku config (e.g. addons) from scratch.

incl:

Schedule a daily task for sending notification email digests: SEND_EMAILS=true ts-node --project tsconfig.json server.ts at 1pm UTC / 6am PT / 9am ET / 3pm CEST

 -->

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

## Custom Domains

<!-- Split off into Custom Domains doc -->

To configure a custom domain, you should :

1. Add the custom domain to Heroku.
2. Add the custom domain to Magic.
3. Set the customDomain field in the `Chains` or `OffchainCommunities` row in the database, corresponding to the community to be served on that domain.

To test, add a new entry to your /etc/hosts file:

```
127.0.0.1       <custom domain>
```

Then run a local SSL proxy, for example:

```bash
npm install -g local-ssl-proxy

local-ssl-proxy --source 443 --target 8080
```

<!-- For anyone else who wants to reproduce locally if you get this error:
Error: listen EACCES: permission denied 0.0.0.0:44
You need to run:
sudo setcap 'cap_net_bind_service=+ep' `which node`
Allows node to bind ports lower than 1024 -->

## Datadog Monitoring on Heroku

<!-- Break out to Databog Monitoring readme -->

`Warning:` Following steps below may lead your app to restart several times, please choose appropriate maintainance window.

### Helpful guides

- [Generic Datadog Heroku Agent Guide](https://docs.datadoghq.com/agent/basic_agent_usage/heroku/)
- [Datadtog Postgres Guide](
https://docs.datadoghq.com/database_monitoring/guide/heroku-postgres/#pagetitle)

### Prerequisites

**Setup Environment Variable**
```bash
  DD_AGENT_MAJOR_VERSION=7
  DD_API_KEY=<SECRET-DATADOG-ACCOUNT-KEY>
  DD_DYNO_HOST=true
  DD_LOG_LEVEL=WARN
  DD_SITE=us5.datadoghq.com
  DD_ENABLE_HEROKU_POSTGRES=true #postgres specific
  DD_HEROKU_CONF_FOLDER=packages/commonwealth/datadog
```

**Install Datadog Buildpack**
This can be done by copying the following URL on Heroku App settings page using `Add Buildpack` button:

```
https://github.com/DataDog/heroku-buildpack-datadog.git
```

**Postgres Monitoring**
- Login to heroku on your local, and use helper script `datadog-db-setup` with target app name as first argument
- This executes script `setup-datadog-postgres.sh` & run `datadog-postgres.sql` in app database
- Script creates new datadog database user, schema & other database object required by Datadog.

```bash
cd packages/commonwealth
yarn datadog-db-setup <app-name> <dd-conf-folder>
#example
yarn datadog-db-setup commonwealth-frick packages/commonwealth/datadog
```

**Datadog Postgres Config**
- Root folder of our app is same as base folder for monorepo, put Postgres Datadog config in root folder of an Heroku app

Postgres config file `datadog/conf.d/postgres.yaml`
Leave file generic, parameters would be replace by `prerun.sh` on runtime if available
```
init_config:

instances:
  - dbm: true
    host: <YOUR HOSTNAME>
    port: <YOUR PORT>
    username: <YOUR USERNAME>
    password: <YOUR PASSWORD>
    dbname: <YOUR DBNAME>
    ssl: True
```

### Verify on Datadog
Visit `https://us5.datadoghq.com/dashboard/lists` for all available dashboards.

Available Postgres Dashboards:
- `Postgres - Metrics`
- `Postgres - Overview`

If datadog agent picked up postgres config & setting properly, you will see your app database name in top dropdown on postgres dashabords

### Datadog - Dashboard

**Copy Widget(s)**
- click on any dashboard `Cmd+c` or using `share` icon and select `Copy` option
- paste to your custom dashboard `Cmd+v`

Example - Copy `connections` widget from `Postgres - metrics` and paste it your `main dashboard`
