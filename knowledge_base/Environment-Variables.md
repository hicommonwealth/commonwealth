# Environment-Variables

This entry documents environment variables (both public config and secret auth tokens) used across the Commonwealth monorepo. Environment variables should always be organized alphabetically.

For a list of config tokens to get you started developing, see our [.env.example](../.env.example) file.

We use GitHub Secrets to manage our auth tokens; reach out to the documentarian Graham Johnson, or else to an engineering lead, if you need access.

If you add a new environment variable, you must add documentation here, providing a default value (if public/config) and describing (1) what does (2) when engineers might need it. As with [all documentation](./_README.md#updating-the-docs-how--when), these changes should be included in the relevant PR where the variable is added.

## Contents

## AIRPLANE_SECRET

Description: We use Airplane.dev tasks for our custom domains. See our [Custom-Domains.md](./knowledge_base/Custom-Domains.md) entry for more info.

Type: Auth.

## AWS_ACCESS_KEY_ID

Description: AWS access key ID for programmatic requests. Used alongside `AWS_SECRET_ACCESS_KEY`.

Type: Auth.

## AWS_REGION

Description: AWS region used primarily for uploading local image files.

Type: Config.

Default Value: `us-east-1`

## AWS_SECRET_ACCESS_KEY

Description: AWS secret used alongside `AWS_ACCESS_KEY_ID`.

Type: Auth

## AXIE_SHARED_SECRET

Description: Secret token used for Axie Infinity login integration.

Type: Auth.

## CHAIN_PORT

Description: Used in chain testing; for more information, see [Chain-Testing-Overview.md](../knowledge_base/Chain-Testing-Overview.md).

Type: Config.

Default Value: `3000`

## CLOUDAMQP_URL

Description: Required in production. The URI of our RabbitMQ instance. This value is usually set automatically by Heroku when a CLOUDAMQP instance is attached to an app.

Type: Heroku.

## COSMOS_GOV_V1

Description: Comma-separated list (e.g. "kyve,csdk") of Cosmos chains using v1 (not v1beta1).

Type: Config.

Owner: Mark Hegel.

Default Value: `kyve,csdk,csdk-v1,quicksilver-protocol,juno,regen`

## COSMOS_REGISTRY_API

Description: Community-maintained data source for Cosmos ecosystem blockchains. Pulls from a [GitHub repo](https://github.com/cosmos/chain-registry/) as its source of truth.

Type: Config.

Owner: Mark Hegel.

Default value: `https://cosmoschains.thesilverfox.pro`

## CW_BOT_KEY

Description: Required for Common bots, e.g. Discobot. In development, can be set to any random identifier string, but must match the value of `CW_BOT_KEY` set in Discobot's .env file.

## DATABASE_CLEAN_HOUR

Description: When the cleaner runs is determined by the DATABASE_CLEAN_HOUR env var. The env var is a simple number between 0 and 24 indicating (in 24hr format) at what time the cleaner should execute the cleaning functions. If env var is not set, the database cleaner will not run.

Owner: Timothee Legros.

## DATABASE_URI

Description: Used to initialize connections to the database.

Type: Config.

Default value: `postgresql://commonwealth:edgeware@localhost/commonwealth`

## DATABASE_URL

Description: Required in production. The URI of the database to connect to. This value is usually set automatically by Heroku when a Heroku Postgres instance is attached to an app. If `NODE_ENV=production` this url is the default.

## DD_ENABLE_HEROKU_POSTGRES

Description: Set on our Heroku `commonwealthapp` pipeline. DataDog configuration token used to enable PSQL on Heroku.

Type: Heroku, Production.

Default value: `TRUE`

## DD_ENABLE_HEROKU_REDIS

Description: Set on our Heroku `commonwealthapp` pipeline. DataDog configuration token used to enable PSQL on Heroku.

Type: Heroku, Production.

Default value: `TRUE`

## DD_DISABLE_HOST_METRICS

Description: Set on our Heroku `commonwealthapp` pipeline to disable metrics that are not presently useful to us.

Type: Heroku, Production.

Default value: `TRUE`

## DD_LOG_LEVEL

Description: Set on our Heroku `commonwealthapp` pipeline. DataDog configuration token determining severity level logged (e.g. ). May be set to `OFF`, `CRITICAL`, `ERROR`, `WARN`, `INFO`, `DEBUG`, or `TRACE`.

Type: Heroku, Production.

Default value: `WARN`

## DD_SITE

Description: Set on our Heroku `commonwealthapp` pipeline. DataDog configuration token specifying our DataDog site region. For more documentation, see [DataDog docs](https://docs.datadoghq.com/getting_started/site/).

Type: Heroku, Production.

Default value: `us5.datadoghq.com`

## DISABLE_CACHE

Description: Disables caching middleware.

Type: Config.

Default value: `FALSE`

## DISCORD_BOT_SUCCESS_URL

Description: Used to construct callback URLs for the `/authCallback` route.

Type: Config.

Default value: `http://localhost:3000`

## DISCORD_BOT_TOKEN

Description: This value should mirror the value of `DISCORD_TOKEN` in the Discobot .env file.

## DISCORD_BOT_URL

Type: Auth

## DISCORD_CLIENT_ID

Description: For local testing, we use the staging Discord app/bot. The client ID can therefore be found on the [developer dashboard](https://discord.com/developers/applications/1027997517964644453/oauth2/general) or by contacting Jake or Timothee.

Type: Auth.

## DISCORD_WEBHOOK_URL_DEV

Description: Connects to the #webhook-testing Discord channel on the Commond Protocol Discord server. Required to use the emit-webhook script to send Discord webhooks. More info at [Webhooks.md](./Webhooks.md).

Type: Auth.

## ENFORCE_SESSION_KEYS

Description: Feature flag for server-side enforcement of Canvas session keys.

Type: Config.

Owner: Raymond Zhong.

Default value: `FALSE`

## ETH_ALCHEMY_API_KEY

Type: CI/CD

Description: If set, the `load-db` package script will replace production Alchemy URLs with their locally supported variants. Only needed if doing work involving querying Ethereum.

## ETH_RPC

<!-- In need of documentation; if you have information about this token, please contribute! -->

## ETHERSCAN_JS_API_KEY

<!-- In need of documentation; if you have information about this token, please contribute! -->

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

Type: Config.

## IS_CI

Description: Used and defined on-the-fly in e2e scripts.

Owner: Kurtis Assad.

## JWT_SECRET

Description: Required in production. The JWT secret that is used to generate all user JWTs.

Type: Auth

## MAGIC_API_KEY

Description: Secret API key for Magic login. Contact Jake Naviasky or Graham Johnson for access.

Type: Auth.

## MAGIC_DEFAULT_CHAIN

Description: Default chain for Magic login.

Type: Config.

Default value: `ethereum`

## MAGIC_PUBLISHABLE_KEY

Description: Publishable API key for Magic login.

Default value: `pk_live_EF89AABAFB87D6F4`

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

## PORT

Default value: `8080`

Description: Localhost port location.

Type: Config

## PROCFILE

Default value: `packages/chain-events/Procfile`

Description: Set in all of our Heroku apps that use a separate procfile. Specifies the path from the root of the repo to the Procfile to use for the deployed app. It is never needed locally but it must be set manually on Heroku and is required in production.

Type: Heroku, Production.

## RABBITMQ_API_URI

Default value: ?

Description: ?

Type: ?

## RABBITMQ_URI

Default value: ?

Description: Should be set if running in the local environment.

Type: ?

## REDIS_URL

Default value: `redis://localhost:6379`

Description: Location of local Redis instance.

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

Description: Used in chain testing; for more information, see [Chain-Testing-Overview.md](../knowledge_base/Chain-Testing-Overview.md).

Type: Config

## SEND_WEBHOOKS_EMAILS

Default value: `FALSE`

Description: Enables Webhook and email dispatching in production when set to `TRUE`. Should be `FALSE` or undefined elsewhere, to prevent Webhooks and emails from being sent in non-production environments.

Type: Config

## SENDGRID_API_KEY

<!-- In need of documentation; if you have information about this token, please contribute! -->

Description: Used in email-based communications (notifications, digests, login).

Type: Auth

## SERVER_URL

Default value: `https://commonwealth.im`

Description: By default, this is set in our `commonwealth/server/config` file to `https://commonwealth.im` if in production, and `http://localhost:8080` otherwise.

Type: Config

## SESSION_SECRET

<!-- In need of documentation; if you have information about this token, please contribute! -->

## SL_BUILD

Default value: `TRUE`

Description: Boolean triggering our `snapshot-listener` package to build.

Type: Config

## SL_PORT

Default value: `8001`

Description: Port used for the `snapshot-listener` package.

## SLACK_FEEDBACK_WEBHOOK

<!-- In need of documentation; if you have information about this token, please contribute! -->

Description: Allows Slack users to send feedback via webhook.

## SLACK_WEBHOOK_URL_DEV

Description: Connects to the #testing-webhooks Slack channel on the Common workspace. Required to use the `emit-webhook` script to send Slack webhooks. This webhook url can be found here: <https://api.slack.com/apps/A05UQUGRWGH/install-on-team>. More info at [Webhooks.md](./Webhooks.md).

Type: Auth.

## SNAPSHOT_HUB_URL

Description: Snapshot Hub URL used for Snapshot API requests.

Default value: `https://hub.snapshot.org`

## TELEGRAM_BOT_TOKEN_DEV

Description: Connects to the CommonWebhooksDev Telegram Bot. Required to use the `emit-webhook` script to send Telegram webhooks. Contact Timothee Legros for an invitation to the channel. More info at [Webhooks.md](./Webhooks.md).

Type: Auth.

Owner: Timothee Legros.

## TEST_ENV

Description: Used and defined on-the-fly in Playwright scripts.

Owner: Kurtis Assad.

## UNIQUE_DOCKER_CONTAINER_ID

Description: A unique ID that is generated to distinguish your remote docker containers from other users.

## WITH_PRERENDER

Description: In a development environment, prerender is only run from `commonwealth/server.ts` if this flag is provided. In production, prerender is run by default and this flag is unnecessary.

Default value: `FALSE`

Type: Config, Development.

## ZAPIER_WEBHOOK_URL_DEV

Description: Connects to the Common Webhooks Dev Zap on Zapier. Required to use the `emit-webhook`script to send Zapier webhooks. The webhook url can be found by contacting Timothee or by viewing the Zap's settings [here](https://zapier.com/editor/209598943/published/209598943/setup) (requires Zapier account access). More info at [Webhooks.md](./Webhooks.md).

Type: Auth.

Owner: Timothee Legros.
