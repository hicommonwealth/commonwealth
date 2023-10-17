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

### Dependency installation

<!-- ASK KURTIS DOCKER STATUS TO ADD SECTION -->

#### Postgres

Run the following commands in bash:

```bash
brew install node yarn postgresql

brew services start postgresql

psql postgres -c "CREATE ROLE commonwealth WITH LOGIN PASSWORD 'edgeware'; ALTER ROLE commonwealth SUPERUSER;"

psql postgres -h 127.0.0.1 -U commonwealth -c "CREATE DATABASE commonwealth;"
```

This should give you a Postgres server installed and running with user `commonwealth` and password `edgeware`.

#### RabbitMQ (optional)

<!-- Valid but not really used anymore—we use the Docker version: yarn start-rmq (see other instances in monorepo for docs)-->

*Installing RabbitMQ is only necessary if you intend to run chain-event listeners locally.*

1. Install RabbitMQ using [the guide for your OS](https://www.rabbitmq.com/download.html).

2. Once installed run the following commands to create a user:

    ```bash
    sudo rabbitmqctl add_user commonwealth edgeware
    
    sudo rabbitmqctl set_user_tags commonwealth administrator
    
    sudo rabbitmqctl set_permissions -p / commonwealth ".*" ".*" ".*"
    ```

    This should give you a RabbitMQ server with user "commonwealth" and password "edgeware"

3. In order for Rascal (the npm package used to interact with RabbitMQ) to set up the queues and necessary configuration, the [RabbitMQ Management plugin](https://www.rabbitmq.com/management.html) must be enabled.

4. For more information on RabbitMQ setup/debugging refer to the [ce-rabbitmq-plugin repo](https://github.com/hicommonwealth/ce-rabbitmq-plugin).

#### nvm

<!-- Optional? Do we need this? -->

For development, you should also install `nvm`.

1. Install nvm

    ```
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash

    nvm install
    ```

2. Run `nvm` to ensure successful installation. If for some reason `nvm` still doesn't work, try setting the source:

    ```bash
    source ~/.nvm/nvm.sh
    ```

3. Use the configured version of node, running `nvm use`.

#### M1 Mac Troubleshooting

<!-- SPLIT OFF INTO DOCS -->

Newer Macs use Apple Silicon (M1, M2, etc) instead of the common Intel chips.

Several critical CLI tools like `nvm` and `brew` do not yet have native versions built for the new M1 architecture. A Rosetta2 terminal is required to properly install them.

For M1+ development, you should follow the same steps as in the **nvm** section, except you must make sure you are using the Rosetta2 Terminal.

1. Download a terminal alternative like [iTerm2](https://iterm2.com/) to your Applications (optionally, rename it, ie: "Rosetta Terminal").

2. In the Applications menu, right-click the new terminal app and click "Get Info."

3. From the “Get info” menu, select “Open using Rosetta“

4. Confirm that you are using a Rosetta Terminal by entering the `arch` command, which should return `i386`

5. You may now use this terminal to install `nvm` and other applications. They will run fine in your usual terminal.

_FOR ALL CLI INSTALLS_ you must prefix `arch -arm64` in front of the command.

For example for python: `arch -arm64 brew install python@3.9`. This will allow you to install using the M1 homebrew with Rosetta. This is crucial.

If errors occur try these steps:

1. Make sure homebrew is installed in the `/opt/` directory

2. If `yarn` stalls out at node-sass, ensure that Python is installed in your Rosetta Terminal path.

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
