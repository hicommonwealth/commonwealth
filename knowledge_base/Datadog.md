# Datadog Monitoring on Heroku

<!-- Break out to Databog Monitoring readme -->

`Warning:` Following steps below may lead your app to restart several times, please choose appropriate maintainance window.

## Helpful guides

- [Generic Datadog Heroku Agent Guide](https://docs.datadoghq.com/agent/basic_agent_usage/heroku/)
- [Datadtog Postgres Guide](
https://docs.datadoghq.com/database_monitoring/guide/heroku-postgres/#pagetitle)

## Prerequisites

**Setup Environment Variable**

```bash
  DD_AGENT_MAJOR_VERSION=7
  DD_API_KEY=<SECRET-DATADOG-ACCOUNT-KEY>
  DD_DYNO_HOST=TRUE
  DD_LOG_LEVEL=WARN
  DD_SITE=us5.datadoghq.com
  DD_ENABLE_HEROKU_POSTGRES=TRUE
  DD_ENABLE_HEROKU_REDIS=TRUE
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

## Verify on Datadog

Visit `https://us5.datadoghq.com/dashboard/lists` for all available dashboards.

Available Postgres Dashboards:

- `Postgres - Metrics`
- `Postgres - Overview`

If datadog agent picked up postgres config & setting properly, you will see your app database name in top dropdown on postgres dashabords

## Datadog - Dashboard

**Copy Widget(s)**

- click on any dashboard `Cmd+c` or using `share` icon and select `Copy` option
- paste to your custom dashboard `Cmd+v`

Example - Copy `connections` widget from `Postgres - metrics` and paste it your `main dashboard`

## Change Log

- 231031: Split off by Graham Johnson from `commonwealth/README.md`. Flagged for overhaul.
