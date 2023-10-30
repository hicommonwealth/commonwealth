## Overview

“Discobot” refers to the set of entities and interactions that power the Commonwealth <> Discord integration. In particular, this is 3 things:

1. Discord Listener (`/packages/discord-bot/discord-listener/discordListener.ts`), an app that handles incoming events from the Discord API and pushes these events to a RabbitMQ queue.
2. Discord Consumer (`/packages/discord-bot/discord-consumer/discordConsumer.ts`), an app that handles events from the RabbitMQ queue and hits the CW API endpoint to create Threads and Comments.
3. RabbitMQ Instance: a queue has been set up called `discord-message` 
4. Commonwealth Manage Community Page (`/packages/commonwealth/…/chain_metadata_rows.tsx`), where admins are able to add a bot connection and connect Forum Channels (in a connected Discord Server) to Topics (in the CW forum).

The basic flow here:
![image (4)](https://github.com/hicommonwealth/commonwealth/assets/31940965/aaf5719a-4ea1-46be-bbbf-3cce55ba7528)

## Deployments

1. Discord Listener: deployed as an app on [discobot-listener](https://dashboard.heroku.com/apps/discobot-listener/resources)
2. Discord Consumer: deployed as an app on [discobot-listener](https://dashboard.heroku.com/apps/discobot-listener/resources)

## Listener Setup

The discord listener is a self contained tsnode service. Follow these steps to set up: 

1. run `yarn install` in the discord-bot directory
2. Set up env variables 
    - Set `DISCORD_TOKEN` to bot's token
    - Set `DATABASE_URL` like other areas of app(not required for local)
    - SSet `RABBITMQ_URI` if running in a non-local environment
3. If running local, run `yarn start-rmq` from root directory
4. Run `yarn start` from discord-bot directory

## Consumer Setup 

The discord consumer service is a rabbitmq subscriber which could be replicated with scale

1. Run `yarn install` in the discord-bot directory
2. Start an instance of the Commonwealth app with `CW_BOT_KEY` set up
3. Set up env variables
    - Set `DATABASE_URL` like other areas of app(not required for local)
    - Set `SERVER_URL` to the Commonwealth URI 
    - Set `CW_BOT_KEY` to key used in app
    - Set `RABBITMQ_URI` if running in a non-local environment
4. If running local, run `yarn start-rmq` from root directory
5. Run `yarn start-consumer`

## Full setup 

The following would be an order of operations for a full setup with the granular steps abstracted 

1. Run RabbitMQ
2. Start Commonwealth App with `CW_BOT_KEY` set.
3. Start `discordListener`
4. Start any number instances of `discordConsumer` with bot key included above

## Testing Locally
- Start the discord-bot-ui app (runs on port 3000 by default).
- Start the commonwealth-discord-bot app (runs on port 3001 by default).
- Create a discord server, and visit a manage community page in CW.
- Click "Connect Discord Bot" button, go through the flow of adding the bot to the server.
- In the server, visit the connect-common channel, click the link, and get directed to discord-bot-ui page.
- If you are a new user, this will redirect to a CW page. Login here if not already logged in.
- Redirect back to discord-bot-ui page and see confirmation screen.

# Change Log

- 231025: Flagged by Timothee Legros - local testing instructions do not work. Updates needed for discobot-staging 
and Frick setup instructions (e.g. Discord server must have community enabled).
- 231006: Ownership transferred to Ian Rowan.
- 230718: Authored by Alex Young.