## Commonwealth: Multi-chain Governance UI

[![CircleCI](https://circleci.com/gh/hicommonwealth/commonwealth/tree/master.svg?style=svg&circle-token=5fa7d1ea8b272bb5e508b933e7a0854366dca1fd)](https://circleci.com/gh/hicommonwealth/commonwealth/tree/master)

### Quickstart

Install dependencies:
```
brew install node yarn postgresql
brew services start postgresql
psql postgres -c "CREATE ROLE commonwealth WITH LOGIN PASSWORD 'edgeware'; ALTER ROLE commonwealth CREATEDB;"
psql postgres -h 127.0.0.1 -U commonwealth -c "CREATE DATABASE commonwealth;"
```

This should give you a Postgres server installed and running with user
"commonwealth" and password "edgeware".

For development, you should also install nvm:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
nvm install
```

To get started developing:

- Use the configured version of node: `nvm use`
- Install packages: `yarn`
- Run the development server in one terminal: `yarn start`
- Reset the dev DB (this will wipe all data): `yarn reset-server`
- Connect to the dev DB: `yarn psql` (or use Postico on Mac)
- Lint your code: `npm install -g eslint`, then `eslint [files]`
- Lint your styles: `yarn stylelint` or `stylelint client/styles/*`

### Environment Variables

Environment variables should be set in a `.env` file in the root of the repository.

Environment variables used for external services include:

- AWS_ACCESS_KEY_ID: for uploading images to Amazon S3
- AWS_SECRET_ACCESS_KEY: for uploading images to Amazon S3
- GITHUB_CLIENT_ID: for Github OAuth login
- GITHUB_CLIENT_SECRET: for Github OAuth login
- INFURA_API_KEY: for lockdrop lookups (requires archive node access, may be deprecated soon)
- MIXPANEL_TOKEN: for analytics
- ROLLBAR_SERVER_TOKEN: for error reporting
- SENDGRID_API_KEY: for sending emails, email login, etc.
- NODE_URL: for server-side proposal archiving (usually ws://testnet2.edgewa.re:9944, may be deprecated soon)

Other environment variables include DATABASE_URL (set by Heroku) and JWT_SECRET and SESSION_SECRET (our secrets).

### Migrations

Any changes to the database models should come with migrations to keep
the production, staging, and local copies of the database in sync.

To create a new migration, run: `npx sequelize migration:generate --name=create-new-table`.

To run any pending migrations: `npx sequelize db:migrate`

To roll back the last migration: `npx sequelize db:migrate:undo`

### Production Environment

Deploying to production bundles and minifies all JavaScript
assets. This takes about 20 minutes and produces about ~10 2MB bundle
files since we have lots of cryptography libraries.

To run the production server locally:

```
NODE_ENV=production yarn build
NODE_ENV=production yarn start
```

### Chat Server

In order to support per-proposal chat, you will also need to check out
and build the `commonwealth-chat` server and run it in the background.

https://github.com/hicommonwealth/commonwealth-chat

Note that the chat server talks to the same database as the main
server, and queries it to check that Users are sending messages from
their own Addresses.

By default it runs on port 3001.

### Deploying

Heroku is used to deploy the server. First, install dependencies for deployment:

```
brew update
brew cask install now
brew tap heroku/brew && brew install heroku
```

Setting up a server environment:

```
heroku git:remote --app commonwealthapp
heroku config:set [Set up session secrets, API keys, OAuth tokens, etc.]
yarn deploy
```

Download and restore the production database, and run migrations:

```
heroku pg:backups:capture
heroku pg:backups:download
npx sequelize db:drop   # Reset the database
npx sequelize db:create # Create a new empty database
pg_restore --verbose --clean --no-acl --no-owner --if-exists -h localhost -U commonwealth -d commonwealth latest.dump
npx sequelize db:migrate
```

At this point you should be ready to go!

### Notes

##### Deployment

The app is compiled into a bundle and pushed to Heroku, which
serves it at commonwealthapp.herokuapp.com. **Migrations are
automatically executed.** If migrations do not complete successfully,
the new backend does not get served.

To access the production DB: `heroku pg:psql`

##### Networks and chains

A `Network` (models.Network) defines which set of modules gets used
for a chain. For example, Edgeware, Polkadot, and Cosmos are
networks. Each network has a distinct set of modules in the
controllers directory, e.g. identity, governance, treasury.

A `Chain` (models.Chain) defines the exact instance of a blockchain
for Commonwealth to connect to. Currently, chains are minimally
differentiated, e.g. we don't store numerical Chain IDs which will be
differentiate between testnet (42) and Edgeware mainnet (ID to be
defined).

A `ChainNode` (models.ChainNode) defines a URL and endpoint associated with a
chain.

##### Stats pages

A Heroku scheduler job which regularly calls `yarn
update-events` to populate the DB with new events. Additionally, the
frontend may use Infura or another DB endpoint to fetch newer events.

To initialize data locally for the stats page, you should call `yarn
update-events` from the command line. **You may have to do this
multiple times if you are initializing the database for the first
time.**

##### Local testnets

Cosmos Hub (Gaia):

- Install [gaia](https://github.com/cosmos/gaia/blob/master/docs/installation.md) by cloning
  the repository and running `make install`. This should make `gaiacli` and `gaiad` available
  in your terminal.
- Follow the instructions at https://github.com/cosmos/gaia/blob/master/docs/deploy-testnet.md
  to start a single-node, local, manual testnet.
- To start an HTTP server, run: `gaiacli rest-server --laddr tcp://localhost:1318 --trust-node`
- To connect to the HTTP server from the development Commonwealth environment, you will need to
  run Google Chrome with the `--disable-web-security` flag, for example:
  `open -a Google\ Chrome --args --disable-web-security --user-data-dir`

Edgeware:

- Install subkey by running `cargo install --force --git https://github.com/paritytech/substrate subkey`,
  or otherwise following the [documentation](https://substrate.dev/docs/en/ecosystem/subkey),
- Follow the instructions at https://github.com/hicommonwealth/edgeware-node to download and
  compile an Edgeware binary.
- Run `target/release/edgeware --alice` to start a local single-node testnet, with Alice as the
  validator.

Polkadot/Kusama:

- Install subkey by running `cargo install --force --git https://github.com/paritytech/substrate subkey`,
  or otherwise following the [documentation](https://substrate.dev/docs/en/ecosystem/subkey),
- Follow the instructions at https://github.com/paritytech/polkadot to download and compile a
  Polkadot binary. Make sure you have checked out the right version of Polkadot that corresponds
  to the Kusama chain.
- Run `target/release/polkadot --alice` to start a local single-node testnet, with Alice as the
  validator.
