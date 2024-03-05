# Environment-Variables

This entry documents environment variables (both public config and secret auth tokens) used across the Commonwealth monorepo. Environment variables should always be organized alphabetically.

For documentation on feature flags managed through Unleash, see the [dedicated entry](./Feature-Flags.md). For a list of config tokens to get you started developing, see our [.env.example](../.env.example) file.

We use GitHub Secrets to manage our auth tokens; reach out to the documentarian Graham Johnson, or else to an engineering lead, if you need access.

If you add a new environment variable, you must add documentation here. Please describe what the variable does and when engineers might need it; tag yourself as an owner if applicable, and list a default value for config tokens. As with [all documentation](./_README.md#updating-the-docs-how--when), these changes should be included in the relevant PR where the variable is added.

## Contents

- [AWS_ACCESS_KEY_ID](#aws_access_key_id)
- [AWS_REGION](#aws_region)
- [AWS_SECRET_ACCESS_KEY](#aws_secret_access_key)
- [AXIE_SHARED_SECRET](#axie_shared_secret)
- [CHAIN_PORT](#chain_port)
- [CLOUDAMQP_URL](#cloudamqp_url)
- [COSMOS_GOV_V1](#cosmos_gov_v1)
- [COSMOS_PROXY_REFERER](#cosmos_proxy_referer)
- [COSMOS_REGISTRY_API](#cosmos_registry_api)
- [CW_BOT_KEY](#cw_bot_key)
- [DATABASE_CLEAN_HOUR](#database_clean_hour)
- [DATABASE_URI](#database_uri)
- [DATABASE_URL](#database_url)
- [DD_AGENT_MAJOR_VERSION](#dd_agent_major_version)
- [DD_API_KEY](#dd_api_key)
- [DD_DYNO_HOST](#dd_dyno_host)
- [DD_ENABLE_HEROKU_POSTGRES](#dd_enable_heroku_postgres)
- [DD_ENABLE_HEROKU_REDIS](#dd_enable_heroku_redis)
- [DD_DISABLE_HOST_METRICS](#dd_disable_host_metrics)
- [DD_LOG_LEVEL](#dd_log_level)
- [DD_SITE](#dd_site)
- [DISABLE_CACHE](#disable_cache)
- [DISCORD_BOT_TOKEN](#discord_bot_token)
- [DISCORD_BOT_URL](#discord_bot_url)
- [DISCORD_CLIENT_ID](#discord_client_id)
- [DISCORD_WEBHOOK_URL_DEV](#discord_webhook_url_dev)
- [DL_BUILD](#dl_build)
- [ENFORCE_SESSION_KEYS](#enforce_session_keys)
- [ETH_ALCHEMY_API_KEY](#eth_alchemy_api_key)
- [ETH_RPC](#eth_rpc)
- [ETHERSCAN_JS_API_KEY](#etherscan_js_api_key)
- [FALLBACK_NODE_DURATION_S](#fallback_node_duration_s)
- [FLAG_COMMUNITY_HOMEPAGE](#flag_community_homepage)
- [FLAG_PROPOSAL_TEMPLATES](#flag_proposal_templates)
- [HEROKU_APP_NAME](#heroku_app_name)
- [IS_CI](#is_ci)
- [JWT_SECRET](#jwt_secret)
- [MAGIC_API_KEY](#magic_api_key)
- [MAGIC_DEFAULT_CHAIN](#magic_default_chain)
- [MAGIC_PUBLISHABLE_KEY](#magic_publishable_key)
- [MAGIC_SUPPORTED_BASES](#magic_supported_bases)
- [MIXPANEL_DEV_TOKEN](#mixpanel_dev_token)
- [MIXPANEL_PROD_TOKEN](#mixpanel_prod_token)
- [NEXT_PUBLIC_RSA_PRIVATE_KEY](#next_public_rsa_private_key)
- [NEXT_PUBLIC_RSA_PUBLIC_KEY](#next_public_rsa_public_key)
- [NO_CLIENT](#no_client)
- [NO_GLOBAL_ACTIVITY_CACHE](#no_global_activity_cache)
- [NO_PRERENDER](#no_prerender)
- [NO_SSL](#no_ssl)
- [NODE_ENV](#node_env)
- [PGPASSWORD](#pgpassword)
- [PORT](#port)
- [PROCFILE](#procfile)
- [RABBITMQ_API_URI](#rabbitmq_api_uri)
- [RABBITMQ_URI](#rabbitmq_uri)
- [REDIS_URL](#redis_url)
- [ROLLBAR_ENV](#rollbar_env)
- [ROLLBAR_SERVER_TOKEN](#rollbar_server_token)
- [RPC_HOST](#rpc_host)
- [SEND_WEBHOOKS_EMAILS](#send_webhooks_emails)
- [SENDGRID_API_KEY](#sendgrid_api_key)
- [SERVER_URL](#server_url)
- [SESSION_SECRET](#session_secret)
- [SL_BUILD](#sl_build)
- [SL_PORT](#sl_port)
- [SLACK_FEEDBACK_WEBHOOK](#slack_feedback_webhook)
- [SLACK_WEBHOOK_URL_DEV](#slack_webhook_url_dev)
- [SNAPSHOT_HUB_URL](#snapshot_hub_url)
- [SUPER_ADMIN_EMAIL](#super_admin_email)
- [SUPER_ADMIN_WALLET_ADDRESS](#super_admin_wallet_address)
- [TELEGRAM_BOT_TOKEN_DEV](#telegram_bot_token_dev)
- [TEST_ENV](#test_env)
- [WITH_PRERENDER](#with_prerender)
- [ZAPIER_WEBHOOK_URL_DEV](#zapier_webhook_url_dev)

## AWS_ACCESS_KEY_ID

AWS access key ID for programmatic requests. Used alongside `AWS_SECRET_ACCESS_KEY`. Read by our `aws4`, `aws-sdk`, and `rollbar` libraries.

## AWS_REGION

AWS region used primarily for uploading local image files. Common uses `us-east-1` by default.

## AWS_SECRET_ACCESS_KEY

AWS secret used alongside `AWS_ACCESS_KEY_ID`. Read by our `aws4`, `aws-sdk`, and `rollbar` libraries.

## AXIE_SHARED_SECRET

Secret token used for Axie Infinity login integration.

## CHAIN_PORT

Used in chain testing; the default value is `3000`. For more information, see [Chain-Testing-Overview.md](../knowledge_base/Chain-Testing-Overview.md).

## CLOUDAMQP_URL

Required in production. The URI of our RabbitMQ instance. This value is usually set automatically by Heroku when a CLOUDAMQP instance is attached to an app.

## COSMOS_GOV_V1

Comma-separated list (e.g. "kyve,csdk") of Cosmos chains using v1 (not v1beta1). As of 231212, this should be `kyve,csdk,csdk-v1,quicksilver-protocol,juno,regen` by default.

Owner: Mark Hagelberg.

## COSMOS_PROXY_REFERER

Optional.
A whitelist Referer header that will prevent us getting rate-limited by the [proxy maintainers](https://github.com/cosmos/chain-registry/).
Only used for cosmosAPI requests.

Owner: Mark Hagelberg.

## COSMOS_REGISTRY_API

Community-maintained data source for Cosmos ecosystem blockchains. Pulls from a [GitHub repo](https://github.com/cosmos/chain-registry/) as its source of truth. As of 231212, this should be `https://cosmoschains.thesilverfox.pro` by default.

Owner: Mark Hagelberg.

## CW_BOT_KEY

Required for Common bots, e.g. Discobot. In development, can be set to any random identifier string, but must match the value of `CW_BOT_KEY` set in Discobot's .env file.

## DATABASE_CLEAN_HOUR

When the cleaner runs is determined by the DATABASE_CLEAN_HOUR env var. The env var is a simple number between 0 and 24 indicating (in 24hr format) at what time the cleaner should execute the cleaning functions. If env var is not set, the database cleaner will not run.

Owner: Timothee Legros.

## DATABASE_URI

Used to initialize connections to the database. By default, set to `postgresql://commonwealth:edgeware@localhost/commonwealth`.

## DATABASE_URL

Required in production. This value is usually set automatically by Heroku when a Heroku Postgres instance is attached to an app.

## DD_AGENT_MAJOR_VERSION

Set in our Heroku `commonwealthapp` pipeline, selecting our Datadog version. As of 240101, we use version `7`.

## DD_API_KEY

Secret Datadog account key. Set in our Heroku `commonwealthapp` pipeline. See [DataDog.md](../knowledge_base/Datadog.md) for more info.

## DD_DYNO_HOST

Boolean set in our Heroku `commonwealthapp` pipeline, in order to scope the buildpack to a dyno. See [DataDog.md](../knowledge_base/Datadog.md) for more info.

## DD_ENABLE_HEROKU_POSTGRES

Boolean set in our Heroku `commonwealthapp` pipeline to enable PSQL analytics through DataDog. See [DataDog.md](../knowledge_base/Datadog.md) for more info.

## DD_ENABLE_HEROKU_REDIS

Boolean set in our Heroku `commonwealthapp` pipeline to enable Redis analytics through DataDog. See [DataDog.md](../knowledge_base/Datadog.md) for more info.

## DD_DISABLE_HOST_METRICS

Boolean in our Heroku `commonwealthapp` pipeline to disable metrics that are not presently useful to us. As of 240101, should be disabled (i.e. `true`). See [DataDog.md](../knowledge_base/Datadog.md) for more info.

## DD_LOG_LEVEL

As of 231212, set to `WARN` in our Heroku `commonwealthapp` pipeline. DataDog configuration token determining severity level logged (e.g. ). May be set to `OFF`, `CRITICAL`, `ERROR`, `WARN`, `INFO`, `DEBUG`, or `TRACE`. See [DataDog.md](../knowledge_base/Datadog.md) for more info.

## DD_SITE

DataDog configuration token in our Heroku pipeline, specifying our DataDog site region. As of 231212, that region is `us5.datadoghq.com`. For more documentation, see [DataDog docs](https://docs.datadoghq.com/getting_started/site/) and [DataDog.md](../knowledge_base/Datadog.md).

## DISABLE_CACHE

If `true`, disables Redis caching middleware.

## DISCORD_BOT_TOKEN

This value should mirror the value of `DISCORD_TOKEN` in the Discobot .env file.

## DISCORD_BOT_URL

<!-- This token appears to be a holdover from the first iteration of Discobot, but is still (likely erroneously) referenced in the Snapshot Consumer. Flagged for removal. -->

## DISCORD_CLIENT_ID

For local testing, we use the staging Discord app/bot. The client ID can therefore be found on the [developer dashboard](https://discord.com/developers/applications/1027997517964644453/oauth2/general) or by contacting Jake or Timothee.

## DISCORD_WEBHOOK_URL_DEV

Connects to the #webhook-testing Discord channel on the Commond Protocol Discord server. Required to use the emit-webhook script to send Discord webhooks. More info at [Webhooks.md](./Webhooks.md).

## DL_BUILD

Boolean which ensures that Heroku only builds the Discobot package and related code when deploying.

## ENFORCE_SESSION_KEYS

Boolean feature flag for server-side enforcement of Canvas session keys; by default, `false`.

Owner: Raymond Zhong.

## ETH_ALCHEMY_API_KEY

Used in our CI/CD and stored in GitHub repo secrets. If set, the `load-db` package script will replace production Alchemy URLs with their locally supported variants. Only needed if doing work that involves querying Ethereum.

Owner: Kurtis Assad.

## ETH_RPC

If set to `e2e-test`, the app will bypass usage of real ETH RPCs and use the mock Metamask RPC instead.

Owner: Ian Rowan

## ETHERSCAN_JS_API_KEY

API key for Ethereum data.

## FALLBACK_NODE_DURATION_S

Optional. Defaults to 5 minutes (300 seconds).
This is number, in seconds. It configures the length of time we will use a community-maintained public endpoint if a given ChainNode fails.
After this time, the server will try the original DB endpoint again.

## FLAG_COMMUNITY_HOMEPAGE

Boolean toggle to display side-wide homepage feature for communities. Temporary flag for 2.0 work.

## FLAG_PROPOSAL_TEMPLATES

Boolean toggle to display side-wide sidebar proposal templates. Temporary flag for 2.0 work.

## HEROKU_APP_NAME

Automatically in Heroku; the respective app name. Required when using the DataDog PSQL integration.

## IS_CI

Used and defined on-the-fly in e2e scripts.

Owner: Kurtis Assad.

## JWT_SECRET

Required in production. The JWT seed secret that is used to generate all user JWTs.

## MAGIC_API_KEY

Secret API key for Magic login. Contact Jake Naviasky or Graham Johnson for access.

## MAGIC_DEFAULT_CHAIN

Default chain for Magic login; as of 231212, we use `ethereum`.

## MAGIC_PUBLISHABLE_KEY

Publishable API key for Magic login; as of 231212, development uses `pk_live_EF89AABAFB87D6F4`.

## MAGIC_SUPPORTED_BASES

Chain bases supported for Magic login; as of 231212, we use `cosmos,ethereum`.

## MIXPANEL_DEV_TOKEN

Mixpanel analytics tracking token for development work. Reach out to a lead to request a token.

## MIXPANEL_PROD_TOKEN

Mixpanel analytics tracking token for our live production site.

## NEXT_PUBLIC_RSA_PRIVATE_KEY

<!-- Likely deprecated; flagged for removal with closing of #6185. -->

## NEXT_PUBLIC_RSA_PUBLIC_KEY

<!-- Likely deprecated; flagged for removal with closing of #6185. -->

## NO_CLIENT

If `true`, disables the front-end build.

## NO_GLOBAL_ACTIVITY_CACHE

If `true`, disables the initialization of `globalActivityCache.ts` from server.

## NO_PRERENDER

In a production environment, prerender is only run from `commonwealth/server.ts` if this flag is false or blank.

## NO_SSL

Used and defined on-the-fly for the `start-external-webpack` package.json script.

## NODE_ENV

The current environment; set to either `production` or `development`. NB: `NODE_ENV` does not indicate whether the app is *actually* in production; the server may be run locally with `NODE_ENV=production` to test building and compiling.

As of 240101, this variable is upstream of how we handle several other environment variables. This is under consideration and will likely be changed soon, with `SERVER_ENV` proposed as a possible replacement.

## PGPASSWORD

Postgres DB password (by default, `edgeware`). Bypasses usual password prompt for local DB commands.

## PORT

Localhost port location, default value `8080`.

## PROCFILE

Set in all of our Heroku apps that use a separate procfile. Specifies the path from the root of the repo to the Procfile to use for the deployed app. It is never needed locally but it must be set manually on Heroku and is required in production. In the production commonwealth app it is set to `packages/commonwealth/Procfile`.

## RABBITMQ_API_URI

This variable will default to the URI of a local RabbitMQ API server. This allows the use of the message publishing script to publish a message to a local RabbitMQ instance.

## RABBITMQ_URI

The URI of the RabbitMQ instance. On any Heroku app that has the CloudAMQP add-on (RabbitMQ provider), this is equal to CLOUDAMQP_URL. Locally, this variable defaults to the URI of a local RabbitMQ instance (Dockerized or native). Does not need to be set in a local environment unless you are spinning up the Discobot or Snapshot listener as well.

## REDIS_URL

Location to host a local Redis instance. By default `redis://localhost:6379`.

## ROLLBAR_ENV

A tag (string) used to identify Rollbar reports by environment, such that we can easily filter on the Rollbar dashboard. In staging and demo apps, we set it to the name of the app. Locally, it should be set to some custom value such as your name in lowercase. It should NEVER be set to `production`.

## ROLLBAR_SERVER_TOKEN

Refers to a specific project on Rollbar. Local and staging (i.e. non-prod) environments should always use the `CommonwealthDev` token, which may be obtained from the Rollbar dashboard, Timothee Legros or an engineering lead. Only prod uses the `Commonwealth` project token.

## RPC_HOST

Used in chain testing; for more information, see [Chain-Testing-Overview.md](../knowledge_base/Chain-Testing-Overview.md). By default, we use the value `ganache`.

## SEND_WEBHOOKS_EMAILS

Enables Webhook and email dispatching in production when set to `true`. Should be `false` or undefined elsewhere, to prevent Webhooks and emails from being sent in non-production environments.

## SENDGRID_API_KEY

Used in email-based communications (notifications, digests, login).

## SERVER_URL

By default, this is set in our `commonwealth/server/config` file to `https://commonwealth.im` if in production, and `http://localhost:8080` otherwise.

## SESSION_SECRET

<!-- In need of documentation improvements; if you have information about this token, please contribute. -->

Equivalent to JWT Secret, but used in testing.

## SL_BUILD

Boolean triggering our `snapshot-listener` package to build.

## SL_PORT

Port used for the `snapshot-listener` package. We use the default value `8001`.

## SLACK_FEEDBACK_WEBHOOK

Enables Common users to share feedback on the app to our Slack. As of 240109, we still hook into the previous Commonwealth Slack, but this is liable to change soon.

## SLACK_WEBHOOK_URL_DEV

Connects to the #testing-webhooks Slack channel on the Common workspace. Required to use the `emit-webhook` script to send Slack webhooks. This webhook url can be found here: <https://api.slack.com/apps/A05UQUGRWGH/install-on-team>. More info at [Webhooks.md](./Webhooks.md).

## SNAPSHOT_HUB_URL

Snapshot Hub URL used for Snapshot API requests. As of 231201 the default value is `https://hub.snapshot.org`.

## SUPER_ADMIN_EMAIL

Used by the `set-super-admin` package script to give super-admin status to the user account which owns the supplied email. Alternatively, SUPER_ADMIN_WALLET_ADDRESS may be set in its stead.

## SUPER_ADMIN_WALLET_ADDRESS

Used by the `set-super-admin` package script to give super-admin status to the user account which owns the supplied address. Alternatively, SUPER_ADMIN_EMAIL may be set in its stead.

## TELEGRAM_BOT_TOKEN_DEV

Connects to the CommonWebhooksDev Telegram Bot. Required to use the `emit-webhook` script to send Telegram webhooks. Contact Timothee Legros for an invitation to the channel. More info at [Webhooks.md](./Webhooks.md).

Owner: Timothee Legros.

## TEST_ENV

Used and defined on-the-fly in Playwright scripts.

Owner: Kurtis Assad.

## WITH_PRERENDER

In a development environment, prerender is only run from `commonwealth/server.ts` if this flag is provided.

## ZAPIER_WEBHOOK_URL_DEV

Connects to the Common Webhooks Dev Zap on Zapier. Required to use the `emit-webhook`script to send Zapier webhooks. The webhook url can be found by contacting Timothee or by viewing the Zap's settings [here](https://zapier.com/editor/209598943/published/209598943/setup) (requires Zapier account access). More info at [Webhooks.md](./Webhooks.md).

Owner: Timothee Legros.
