# Environment-Variables

This entry documents environment variables (both public config and secret auth tokens) used across the Commonwealth monorepo. Environment variables should always be organized alphabetically.

For a complete list of default config token values, see our [.env.defaults](../.env.defaults) file.

We use GitHub Secrets to manage our auth tokens; reach out to the documentarian, or to an engineering lead, if you need access.

If you add a new environment variable, you must add documentation here, providing a default value (if public/config) and describing (1) what does (2) when engineers might need it. As with [all documentation](./_README.md#updating-the-docs-how--when), this should be included in the relevant PR where the variable is added.

## Contents

## AIRPLANE_SECRET

Description: ?

Type: Auth

## AWS_ACCESS_KEY_ID

Description: AWS access key ID for programmatic requests. Used alongside `AWS_SECRET_ACCESS_KEY`.

Type: Auth

## AWS_REGION

Default Value: `us-east-1`

Description: AWS region used primarily for uploading local image files.

Type: Config

## AWS_SECRET_ACCESS_KEY

Description: AWS secret used alongside `AWS_ACCESS_KEY_ID`.

Type: Auth

## AXIE_SHARED_SECRET

Description: Axie Infinity login integration.

Type: Auth

## CHAIN_PORT

Default Value: `3000`

Description: Host port for API Abstraction container.

Type: Config

## CE_CI_TESTING

## CLOUDAMQP_URL

Default value: ?

Description: Required in production. The URI of the RabbitMQ instance. This value is usually set automatically by Heroku when a CLOUDAMQP instance is attached to an app.

Type: ?

## COSMOS_GOV_V1

Default Value: `kyve,csdk,csdk-v1,quicksilver-protocol,juno,regen`

Description: Comma-separated list (e.g. "kyve,csdk"). Cosmos chains using v1 (not v1beta1). These communities will use their LCD endpoint.

Contributor: Mark Hegel

Type: Config

## COSMOS_REGISTRY_API

Default value: `https://cosmoschains.thesilverfox.pro`

Description: Community-maintained data source for Cosmos ecosystem blockchains. Pulls from the following repo as a source of truth: <https://github.com/cosmos/chain-registry/>.

## CW_BOT_KEY

Description: Required for Common bots, e.g. Discobot. Can be set to any random identifier string.

## DATABASE_CLEAN_HOUR

Description: If env var is not set, the database cleaner will not run.

## DATABASE_URI

Default value: `postgresql://commonwealth:edgeware@localhost/commonwealth`

Description: Used to initialize connections to the database.

Type: Config

## DATABASE_URL

Description: Required in production. The URI of the database to connect to. This value is usually set automatically by Heroku when a Heroku Postgres instance is attached to an app. If `NODE_ENV=production` this url is the default.

## DD_ENABLE_HEROKU_POSTGRES

Default value: `TRUE`

Description: DataDog configuration token used to enable PSQL on Heroku.

Type: Config

## DD_HEROKU_CONF_FOLDER

Default value: `packages/commonwealth/datadog`

Description: DataDog configuration.

Type: Config

## DD_LOG_LEVEL WARN

Default value: `WARN`

Description: DataDog configuration token.

Type: Config

## DD_SITE

Default value: `us5.datadoghq.com`

Description: DataDog configuration token.

Type: Config

## DISABLE_CACHE

Default value: `FALSE`

Description: Disables caching middleware.

## DISCORD_BOT_SUCCESS_URL

Default value: `http://localhost:3000`

Type: Config

## DISCORD_BOT_TOKEN

Type: Auth

## DISCORD_BOT_URL

Type: Auth

## DISCORD_CLIENT_ID

Description: For Discord OAuth login.

Type: Auth

## DISCORD_WEBHOOK_URL_DEV

Description: Connects to the #webhook-testing Discord channel on the Commond Protocol Discord server. Required to use the emit-webhook script to send Discord webhooks. More info at [Webhooks.md](./Webhooks.md).

Type: Auth

## ENFORCE_SESSION_KEYS

Default value: FALSE

Description: Feature flag for server-side enforcement of Canvas session keys.

Type: Config

Contributor: Raymond Zhong

## ENTITIES_URL

Default value: `https://chain-events.herokuapp.com/api`

Description: Used in CI flow.

Type: Config

## ETH_ALCHEMY_API_KEY

Type: ?

Description: If set, the `load-db` package script will replace production Alchemy URLs with their locally supported variants.

## ETH_RPC

Description: ?

## ETHERSCAN_JS_API_KEY

## FLAG_COMMUNITY_HOMEPAGE

Default value: `FALSE`

Description: Toggles side-wide homepage feature for communities. Temporary flag for 2.0 work.

Type: Config

## FLAG_PROPOSAL_TEMPLATES

Default value: `FALSE`

Description: Toggles side-wide visibility of sidebar proposal templates. Temporary flag for 2.0 work.

Type: Config

## FLAG_SIDEBAR_TOGGLE

Default value: `FALSE`

Description: Toggles side-wide visibility of discussions homepage sidebar. Temporary flag for 2.0 work.

Type: Config

## HEROKU_APP_NAME

Default value: ?

Description: The subdomain of the heroku app hosting the server.

Type: Config

## IS_CI

Default value: ?

## JWT_SECRET

Description: Required in production. The JWT secret that is used to generate all user JWTs.

Type: Auth

## MAGIC_API_KEY

Description: Secret API key for Magic login.

Type: Auth

## MAGIC_DEFAULT_CHAIN

Default value: `ethereum`

Description: Default chain for Magic login.

Type: Config

## MAGIC_PUBLISHABLE_KEY

Description: Publishable API key for Magic login.

Type: ?

## MAGIC_SUPPORTED_BASES

Default value: `substrate,ethereum`

Description: Supported chain bases for Magic login.

Type: Config

## MIXPANEL_DEV_TOKEN

Mixpanel analytics tracking token for development work.

Type: Auth

## MIXPANEL_PROD_TOKEN

Description: Mixpanel analytics tracking token for product.

Type: Auth

## NEXT_PUBLIC_RSA_PRIVATE_KEY

Description: ?

Type: Auth

## NEXT_PUBLIC_RSA_PUBLIC_KEY

Description: ?

Type: ?

## NO_CLIENT

Default value: `FALSE`

Description: Disables the front-end build if set to `TRUE`.

## NO_GLOBAL_ACTIVITY_CACHE

Default value: ?

Description: ?

Type: Config

## NO_PRERENDER

Default value: ?

Description: ?

Type: Config

## NO_SSL

Default value: `FALSE`

Description: Used in `start-external-webpack` package.json script.

Type: Config

## NO_TOKEN_BALANCE_CACHE

Default value: `FALSE`

Description: If `TRUE`, token balance cache not started.

Type: Config

## NODE_ENV

Default value: `development`

Description: May be set to `production` or `development`. Dictates where a listener will get its initial spec. When `NODE_ENV=production` the listener gets its spec from commonwealth.im. Otherwise, the listener will get its spec from the commonwealth server hosted locally.

Type: Config

## PGPASSWORD

Default value: `edgeware`

Description: Postgres DB password. Bypasses usual password prompt for local DB commands.

Type: Config

## PINATA_API_KEY

Default value: ?

Description: Used for IPFS hosting.

Type: ?

## PINATA_SECRET_API_KEY

Default value: ?

Description: Used for IPFS hosting.

Type: Auth

## PORT

Default value: `8080`

Description: Localhost port location.

Type: Config

## PROCFILE

Default value: `packages/chain-events/Procfile`

Description: Set in all of our Heroku apps that use a separate procfile. Specifies the path from the root of the repo to the Procfile to use for the deployed app. It is never needed locally but it must be set manually on Heroku and is required in production.

Type: ?

## RABBITMQ_API_URI

Default value: ?

Description: ?

Type: ?

## RABBITMQ_URI

Default value: ?

Description: Should be set if running in the local environment.

Type: ?

## REDIS_URL

Default value: ?

Description: ?

Type: ?

## REPEAT_TIME

Default value: ?

Description: The number of minutes the ChainSubscriber should wait between requests to the CW app to retrieve the chains it should be listening to. It is currently set to 10 minutes which means every 10 minutes the ChainSubscriber will query the CW App and retrieve all chains that have `has_chain_events_listener` set to True in the `Chains` model.

Type: Config

## ROLLBAR_ENV

Default value: n/a

Description: Separates Rollbar reports by environment such that we can easily filter on the Rollbar dashboard. In staging Heroku apps it is set to the name of the app. Locally it should be set to some custom value like your name in lowercase (NEVER `production`).

Type: Config

## ROLLBAR_SERVER_TOKEN

Default value: `?`

Description: Required in production. The Rollbar token for the appropriate environment/app. Real-time error tracking.

Type: Config

## RPC_HOST

Default value: `ganache`

Description: ?

Type: Config

## SEND_WEBHOOKS_EMAILS

Default value: `FALSE`

Description: Enables Webhook and email dispatching in production when set to `TRUE`. Should be `FALSE` or undefined elsewhere, to prevent Webhooks and emails from being sent in non-production environments.

Type: Config

## SENDGRID_API_KEY

Default value: ?

Description: Used in email-based communications (notifications, digests, login).

Type: Auth

## SERVER_URL

Default value: `https://commonwealth.im`

Description: The Commonwealth server URL

Type: Config

## SESSION_SECRET

Default value: ?

Description: Used in server session parsers

Type: Config

## SL_BUILD

Default value: `TRUE`

## SLACK_FEEDBACK_WEBHOOK

Default value: ?

Description: Allows Slack users to send feedback via webhook.

## SLACK_WEBHOOK_URL_DEV

Default value: ?

Description: Connects to the #testing-webhooks Slack channel on the Common workspace. Required to use the `emit-webhook` script to send Slack webhooks. More info at [Webhooks.md](./Webhooks.md).

## SNAPSHOT_HUB_URL

## TELEGRAM_BOT_TOKEN_DEV

Default value:?

Description: Connects to the CommonWebhooksDev Telegram Bot. Required to use the `emit-webhook` script to send Telegram webhooks. More info at [Webhooks.md](./Webhooks.md).

## TEST_ENV

Description: Used and defined on-the-fly in Playwright scripts.

## UNIQUE_DOCKER_CONTAINER_ID

Description: A unique ID that is generated to distinguish your remote docker containers from other users.

## WITH_PRERENDER

Description: ?

Type: ?

## ZAPIER_WEBHOOK_URL_DEV

Default value: ?

Description: Connects to the Common Webhooks Dev Zap on Zapier. Required to use the `emit-webhook`script to send Zapier webhooks. More info at [Webhooks.md](./Webhooks.md).
