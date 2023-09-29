# Webhooks
## Overview
### Development
To facilitate testing of specific webhooks there is a script (`packages/commonwealth/server/scripts/emitWebhook.ts`)
which can be invoked to emit a webhook with real data to any desired destination via the `yarn emit-webhook` command.

For information on how to use this script, run `yarn emit-webhook --help`.

Example - emit a new thread notification to `webhook-testing` Discord channel:
```
yarn emit-webhook -c new-thread-creation -d discord
```


## Destinations
### Telegram
In order for users to receive Telegram webhooks, they must add the production bot to their channel
and then provide a Telegram API url to their Telegram channel.

**Production**

We have a Telegram bot that goes by the name `@CommonWebhooksBot`. The owner of this
bot is Dillon Chen. The bot's token is found in the `commonwealthapp` Heroku app
environment variables as `TELEGRAM_BOT_TOKEN`. The token can also be retrieved
by Dillon by interacting with [@BotFather](https://t.me/botfather) on Telegram.

**Development**

We have a Telegram bot that goes by the name `@CommonWebhooksDevBot`. The owner of this
bot is also Dillon Chen. The token can be found in `frick` or `frack` Heroku app
environment variables as `TELEGRAM_BOT_TOKEN`. The token can also be retrieved
by Dillon by interacting with [@BotFather](https://t.me/botfather) on Telegram.

There is also a development Telegram channel named `Common Webhook Dev`. To join this
channel you must be invited. Contact Dillon or Timothee for the invite link. The
`@CommonWebhooksDevBot` is an admin of this channel and therefore can be used to
test Telegram webhooks.

### Discord

**Development**

There is a webhook testing channel on the Common Protocol Discord server. Here is an
invitation link to the server: https://discord.gg/commonwealth. To access the `webhook-testing`
channel, message one of the server moderators. The webhook for the channel can be found
in the channel's 'integration' settings.

### Slack

**Development**

There is a webhook testing channel named `testing-webhooks` on the Common Slack workspace. Contact Timothee
for an invitation to the channel. The `testing-webhooks` channel has a Slack app called `Common Webhooks Dev`
installed in it. This app contains the webhook url used to send messages to the channel. This webhook url
can be found here: https://api.slack.com/apps/A05UQUGRWGH/install-on-team.

### Zapier