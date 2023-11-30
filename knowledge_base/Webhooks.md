**Contents**

- [Overview](#overview)
  * [Production](#production)
  * [Development](#development)
    + [Testing Script](#testing-script)
    + [Pattern](#pattern)
- [Destinations](#destinations)
  * [Telegram](#telegram)
    + [Production](#production-1)
    + [Development](#development-1)
  * [Discord](#discord)
    + [Development](#development-2)
  * [Slack](#slack)
    + [Development](#development-3)
  * [Zapier](#zapier)
    + [Development](#development-4)

# Overview

## Production

Set the `SEND_WEBHOOKS_EMAILS` env var to true to enable sending Webhooks and emails. This env var should be false or undefined everywhere except for the production app (i.e. undefined on Frick/Frack/QA).

## Development

### Testing Script

To facilitate testing of specific webhooks there is a script (`packages/commonwealth/server/scripts/emitWebhook.ts`) which can be invoked to emit a webhook with real data to any desired destination via the `yarn emit-webhook` command.

For information on how to use this script, run `yarn emit-webhook --help`.

Example - emit a new thread notification to `webhook-testing` Discord channel:

```
yarn emit-webhook -c new-thread-creation -d discord
```

### Pattern

The logic for each webhook destination should be contained in a single file in
`packages/commonwealth/server/util/destinations/` where the name of the file is the name of the destination. Within the file, there should be 3 things:

1. A type definition for the destination's webhook payload
2. A function that takes generic webhook data and returns a formatted message specific to the destination
3. A function that takes generic webhook data and sends the formatted message to the destination.

The `getWebhookData.ts` file contains a function which transforms a NotificationDataAndCategory object into the generic WebhookData object needed for the destination functions.

Finally, the `dispatchWebhook.ts` file contains a function which given a NotificationDataAndCategory will emit all necessary webhooks. This is the root function for all webhook emission.

# Destinations

## Telegram

In order for users to receive Telegram webhooks, they must add the production bot to their channel
and then provide a Telegram API url to their Telegram channel.

### Production

We have a Telegram bot that goes by the name `@CommonWebhooksBot`. The owner of this
bot is Dillon Chen. The bot's token is found in the `commonwealthapp` Heroku app
environment variables as `TELEGRAM_BOT_TOKEN`. The token can also be retrieved
by Dillon by interacting with [@BotFather](https://t.me/botfather) on Telegram.

### Development

We have a Telegram bot that goes by the name `@CommonWebhooksDevBot`. The owner of this
bot is also Dillon Chen. The token can be retrieved by Dillon by interacting with
[@BotFather](https://t.me/botfather) on Telegram. The token may also be found on Heroku apps as the
`TELEGRAM_BOT_TOKEN_DEV` environment variable.

There is also a development Telegram channel named `Common Webhook Dev`. To join this
channel you must be invited. Contact Dillon or Timothee for the invite link. The
`@CommonWebhooksDevBot` is an admin of this channel and therefore can be used to
test Telegram webhooks.

`TELEGRAM_BOT_TOKEN_DEV` environment variable required to use the `emit-webhook` script to send Telegram webhooks.

## Discord

### Development

There is a webhook testing channel on the Common Protocol Discord server. Here is an
invitation link to the server: <https://discord.gg/commonwealth>. To access the `webhook-testing`
channel, message one of the server moderators. The webhook for the channel can be found
in the channel's 'integration' settings.

`DISCORD_WEBHOOK_URL_DEV` environment variable required to use the `emit-webhook` script to send Discord webhooks.

## Slack

### Development

There is a webhook testing channel named `#testing-webhooks` on the Common Slack workspace. Contact Timothee Legros for an invitation to the channel. The `#testing-webhooks` channel has a Slack app called `Common Webhooks Dev` installed in it. This app contains the webhook url used to send messages to the channel. This webhook url can be found here: <https://api.slack.com/apps/A05UQUGRWGH/install-on-team>.

`SLACK_WEBHOOK_URL_DEV` environment variable required to use the `emit-webhook` script to send Slack webhooks.

## Zapier

Zapier webhook payload format is found in `packages/commonwealth/server/util/webhooks/destinations/zapier.ts`.

### Development

There is a Zapier Zap called Common Webhook Dev which is on the `ops@commonwealth.im` Zapier account. This Zap receives webhook payloads in step 1 and sends a formatted message to the `testing-webhooks` Slack channel in step 2.

The webhook url can be found by contacting Timothee or by viewing the Zap's settings [here](https://zapier.com/editor/209598943/published/209598943/setup) (requires Zapier account access).

`ZAPIER_WEBHOOK_URL_DEV` environment variable required to use the `emit-webhook` script to send Zapier webhooks.

## Change Log

- 231011: Authored by Timothee Legros.
