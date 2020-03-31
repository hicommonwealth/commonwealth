# Commonwealth

Discussions and governance for blockchain networks.

We're moving our development over to open source over the first half of April 2020; this repo will be updated with PRs, license, and other materials soon. In the meantime, please feel free to file issues here: https://github.com/hicommonwealth/commonwealth-oss/issues

[![CircleCI](https://circleci.com/gh/hicommonwealth/commonwealth/tree/master.svg?style=svg&circle-token=5fa7d1ea8b272bb5e508b933e7a0854366dca1fd)](https://circleci.com/gh/hicommonwealth/commonwealth/tree/master)

## Quickstart

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

- Use the configured version of node: `nvm use`
- Install packages: `yarn`
- Run the development server in one terminal: `yarn start`
- Reset the dev DB (this will wipe all data): `yarn reset-server`
- Connect to the dev DB: `yarn psql` (or use Postico on Mac)
- Lint your code: `npm install -g eslint`, then `eslint [files]`
- Lint your styles: `yarn stylelint` or `stylelint client/styles/*`

Now, download a copy of the production database if necessary, and
set up any environment variables

## Production Database

To download and restore the production database, and run migrations:

```
heroku pg:backups:capture
heroku pg:backups:download
npx sequelize db:drop   # Reset the database
npx sequelize db:create # Create a new empty database
pg_restore --verbose --clean --no-acl --no-owner --if-exists -h localhost -U commonwealth -d commonwealth latest.dump
npx sequelize db:migrate
```

At this point you should be ready to go!

The app is compiled into a bundle and pushed to Heroku, which
serves it at commonwealthapp.herokuapp.com. **Migrations are
automatically executed.** If migrations do not complete successfully,
the new backend does not get served.

To access the production DB: `heroku pg:psql`

To run the production server locally:

```
NODE_ENV=production yarn build
NODE_ENV=production yarn start
```

## Environment Variables

You should create a `.env` file in the root of the repository
to store environment variables like session secrets.

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
- DATABASE_URL (set by Heroku)
- JWT_SECRET
- SESSION_SECRET

## Migrations

If you are making changes to the database models, you must also write
migrations to update the production database and keep it in sync with
the models. Be sure to run and test your migrations before making a PR.

To create a new migration, run: `npx sequelize migration:generate --name=create-new-table`.

To run any pending migrations: `npx sequelize db:migrate`

To roll back the last migration: `npx sequelize db:migrate:undo`

## Setting up a new Production Environment

Deploying to production bundles and minifies all JavaScript assets.
This takes a while, usually about 15 minutes.

First, install dependencies for deployment:

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

## Chat Server

In order to use chat functionality, you will also need to check out and
build the `commonwealth-chat` server and run it in the background.

https://github.com/hicommonwealth/commonwealth-chat

The chat server talks to the same database as the main server. It only
makes a couple of simple queries, to read/write to message history and
check that Users are sending messages from valid Addresses.

By default it runs on port 3001.

----

## Development Notes

### Main app

Each `Network` has a distinct set of modules in the
controllers directory, e.g. identity, governance, treasury.
For example, Edgeware, Polkadot, and Cosmos are networks.

Each `Chain` is a specific instance of a blockchain network that 
Commonwealth may connect to. Currently, chains are only identified
by the nodes that serve them, and not by genesis block or returned
chain ID.

Each `ChainNode` defines a URL and endpoint where Commonwealth can
connect to a particular chain.

### Stats pages

A Heroku scheduler job which regularly calls `yarn update-events` to
populate the DB with new events. The frontend may use also use Infura
or another Web3 provider to make another pass and fetch newer events.

To initialize data locally for the stats page, you should call `yarn
update-events` from the command line. You may have to do this many
times if you are initializing the database for the first time.

### Setting up local testnets

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
