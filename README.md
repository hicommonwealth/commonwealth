# Commonwealth

Discussions and governance for blockchain networks.

[![CircleCI](https://circleci.com/gh/hicommonwealth/commonwealth/tree/master.svg?style=svg&circle-token=5fa7d1ea8b272bb5e508b933e7a0854366dca1fd)](https://circleci.com/gh/hicommonwealth/commonwealth/tree/master)

## Quickstart

###Install dependencies:
**Postgres**
```bash
brew install node yarn postgresql
brew services start postgresql
psql postgres -c "CREATE ROLE commonwealth WITH LOGIN PASSWORD 'edgeware'; ALTER ROLE commonwealth CREATEDB;"
psql postgres -h 127.0.0.1 -U commonwealth -c "CREATE DATABASE commonwealth;"
```

This should give you a Postgres server installed and running with user
"commonwealth" and password "edgeware".

**RabbitMQ - optional**

*Installing RabbitMQ is only necessary if you intend to run chain-event listeners locally.*

Install RabbitMQ using the guide for your OS: https://www.rabbitmq.com/download.html

Once installed run the following commands to create a user:
```bash
sudo rabbitmqctl add_user commonwealth edgeware
sudo rabbitmqctl set_user_tags commonwealth administrator
sudo rabbitmqctl set_permissions -p / commonwealth ".*" ".*" ".*"
```

This should give you a RabbitMQ server with user "commonwealth" and password "edgeware"

**nvm**

For development, you should also install nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
nvm install
```

- if for some reason, nvm still doesn't work, try using
```bash
    source ~/.nvm/nvm.sh
```

- Use the configured version of node: `nvm use`
- Install packages: `yarn`
    - This is equivalent to `yarn update`
    - Do not run `yarn upgrade` unless you are explicitly trying to upgrade packages
- Run the development server in one terminal: `yarn start`
- Reset the dev DB (this will wipe all data): `yarn reset-server`
- Connect to the dev DB: `yarn psql` (or use Postico on Mac)
- Lint your code: `npm install -g eslint`, then `eslint [files]`
- Lint your styles: `yarn stylelint` or `stylelint client/styles/*`

Now, you should set up environment variables, following the instructions in
the section below.

If you are not using backend storage of chain events, we recommend
running with NO_EVENTS=true to reduce load on your dev computer, and reduce
the number of possible errors you might run into.

You should also download a copy of the production database if possible.
following the Production Database instructions afterwards.

## Environment Variables

You should create a `.env` file in the root of the repository
to store environment variables like session secrets.

Environment variables used for external services include:

- AWS_ACCESS_KEY_ID: for uploading images to Amazon S3
- AWS_SECRET_ACCESS_KEY: for uploading images to Amazon S3
- AWS_REGION: for uploading images to Amazon S3 (conventionally 'us-east-2')
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
- MAGIC_API_KEY
- MAGIC_SUPPORTED_BASES
- MAGIC_DEFAULT_CHAIN

We also use certain environment variables to configure the application itself:

- CHAIN_EVENTS: select chains for event listening. Must be "all", "none", or a comma-separated list of chains (e.g. "edgeware,edgeware-local")
- NO_EVENTS: disable chain-event functionality entirely
- NO_CLIENT: set to true to disable the front-end build

## Production Database

To download and restore the production database, and run migrations:

```
pg_dump $(heroku config:get DATABASE_URL --app commonwealthapp) --verbose --exclude-table-data="public.\"Sessions\"" --exclude-table-data="public.\"DiscussionDrafts\"" --exclude-table-data="public.\"LoginTokens\"" --exclude-table-data="public.\"Notifications\"" --exclude-table-data="public.\"EdgewareLockdropEverythings\"" --exclude-table-data="public.\"EdgewareLockdropBalances\"" --exclude-table-data="public.\"EdgewareLockdropEvents\"" --exclude-table-data="public.\"SocialAccounts\"" --exclude-table-data="public.\"Webhooks\"" --exclude-table-data="public.\"ChainEvents\"" --no-privileges --no-owner -f latest.dump

npx sequelize db:drop
npx sequelize db:create
psql -d commonwealth -U commonwealth -f latest.dump
```

To access the production DB:

```
heroku pg:psql
```

To run the production server locally:

```
NODE_ENV=production yarn build
NODE_ENV=production yarn start
```

To copy the production database to the staging database for testing purposes, ensuring migrations will work:
```
# turn off the web dynos in staging
heroku maintenance:on -a <STAGING_APP>
# backup the staging database in case of an error
heroku pg:backups capture -a <STAGING_APP>
# copy db from production app database url to staging url
heroku pg:copy <PRODUCTION_APP>::<PRODUCTION_DB_URL> <STAGING_DB_URL> -a <STAGING_APP>
# turn on the web dynos in staging
heroku maintenance:off -a <STAGING_APP>
```

## Running Migrations

A number of migrations for loading the latest on-chain data are
defined in server.ts and package.json. To run these migrations on
Heroku, some special syntax is needed.

For example, to run the councillor/validator flags migration:

```
FLAG_MIGRATION=true ts-node --log-error --project tsconfig.node.json server.ts
```

## Production Logs
## Extending Boot Timeout

Heroku may need more time to boot the production server. If so, you can extend
the boot timeout here: https://tools.heroku.support/limits/boot_timeout

## Frontend Code Style

Set up global linters (e.g. eslint and stylelint) to make sure your code is formatted properly.

Components should be namespaced by class name, e.g. a component called MembersBox should be:

- placed in client/scripts/views/components/members_box.ts, as a default export
- styled in client/styles/components/members_box.scss
- exported as a Mithril component with parent class .MembersBox

## Migrations

If you are making changes to the database models, you must also write
migrations to update the production database and keep it in sync with
the models. Be sure to run and test your migrations before making a PR.

To create a new migration, run: `npx sequelize migration:generate --name=create-new-table`.

To run any pending migrations: `npx sequelize db:migrate`

To roll back the last migration: `npx sequelize db:migrate:undo`

## Deploying to Production / Setting up a new Production Environment

Deploying to production bundles and minifies all JavaScript assets.
This takes a while, usually about 15 minutes.

First, install dependencies for deployment:

```
brew update
brew install --cask now
brew tap heroku/brew && brew install heroku
```

To set up the production server environment:

```
heroku git:remote --app <PRODUCTION_APP>
heroku config:set [Set up session secrets, API keys, OAuth tokens, etc.]
heroku addons:create timber-logging       # Set up a logging service
heroku features:enable preboot            # Set up preboot (old deploys will not shut down until the new deploys are receiving requests)
heroku addons:create scheduler:standard   # Set up schedule
git push heroku master
```

You should now set up any databases and services needed. In particular:

- Schedule a daily task for sending notification email digests:
  `SEND_EMAILS=true ts-node --project tsconfig.node.json server.ts`
  at 1pm UTC / 6am PT / 9am ET / 3pm CEST

## Custom Domains

To configure a custom domain, you should:

- Add the custom domain to Heroku
- Add the custom domain to Magic
- Set the customDomain field in the Chains or OffchainCommunities
  row in the database, corresponding to the community to be served on
  that domain.

You can test the custom domain by setting it in your /etc/hosts file
and running a local SSL proxy, for example:

```
npm install -g local-ssl-proxy
local-ssl-proxy --source 443 --target 8080
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

Moloch (Eth):

Install the latest for truffle and ganache-cli. Otherwise Moloch
contract compilation may be affected.
```
npm install -g truffle@latest
npm install -g ethereumjs-testrpc@latest
npm install -g ganache-cli@latest
```

- You may need to create a Moloch endpoint in Metamask using the `127.0.0.1:9545` url. You can then add the summoner account to Metamask for testing using private key `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d` (corresponding public key `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`). It should display "100 ETH" in the Metamask window.
  - If you make any transactions and then reset the chain, you will need to reset the Metamask transaction history via "Settings -> Advanced -> Reset Account".
- The other accounts available for testing can be found in the `eth/migrations/3_moloch_v1.js`. They are the 2nd through 6th accounts printed at the top of the `ganache-cli` output. They all have 100 ETH and 5 tokens that can be used as tribute. These private keys can also be added to Metamask.
- You may need to transfer extra tokens (TKN) from `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1` (the summoner) to other accounts if you wish to test delegate or creating proposals on behalf of other participants. If you do this, you'll need to go to the Commonwealth Moloch settings page and authorize additional token.
- The "moloch-local" chain is always configured to fetch data from the chain directly.
  - To start the test chain, invoke `ganache-cli -p 9545 -d --allowUnlimitedContractSize -l 100000000` and run `truffle deploy` in `eth/`.
  - To start the test chain, invoke `ganache-cli -p 9545 -d --allowUnlimitedContractSize -l 100000000` and run `truffle deploy` in `eth/`.
  - Initialize the app with `yarn start`.

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
