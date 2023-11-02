# Heroku

## Production Database

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

## Schedule a daily task for sending notification email digests

SEND_EMAILS=true ts-node --project tsconfig.json server.ts at 1pm UTC / 6am PT / 9am ET / 3pm CEST

## Change Log

- 231031: Split off by Graham Johnson from `commonwealth/README.md`. Flagged for overhaul.
