# Commonwealth

Commonwealth is an all-in-one platform for on-chain communities to discuss, vote, and fund projects together.

## Quickstart

Clone the repository:

```bash
git clone https://github.com/hicommonwealth/commonwealth.git
```

To install dependencies using Docker, navigate into the `packages/commonwealth` directory and run `docker-compose up`.

If you are not using Docker, you will need to manually install Postgres. Run the following commands in bash:

```bash
brew install node yarn postgresql

brew services start postgresql

psql postgres -c "CREATE ROLE commonwealth WITH LOGIN PASSWORD 'edgeware'; ALTER ROLE commonwealth SUPERUSER;"

psql postgres -h 127.0.0.1 -U commonwealth -c "CREATE DATABASE commonwealth;"
```

This should start a new Postgres server with superuser `commonwealth` and password `edgeware`.

To get a fresh production database dump from Heroku, run `yarn dump-db`. To reset, seed, and migrate your local database using the obtained dump file, run `yarn db-all`. Enter `edgeware` if prompted for a password.

To start the app, run `yarn start`.

## Environment Variables

Create a `.env` file at the `package/commonwealth` level to store minimum security environment variables. Higher security secrets should be stored inside an `.auth` file.

Use the [.env.example](../../.env.example) file to get yourself set up.

## Further Information

For more information, see our [Knowledge Base directory](../../knowledge_base/_TOC.md).
