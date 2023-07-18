# Discord Bot 

This package provides services to listen to forum channels that the CW discord bot is active in and publish forum posts to Commonwealth.

The discord bot has two main services

1. Discord Listener
    - Listens to Discord via the bot's token access
    - Provides minimal filtering of what messages are relevant to CW communities.
    - Publishes consolidated messages to a queue for consumtion 

2. Discord Consumer
    - Consumes messages from Listner in queue
    - Process messages into either Threads or comments 
    - Post threads and comments to CW 

## System Architecture 

The discord bot uses a queing system architecture to handle potential scale of messages. The basic components involved in the arch are 

1. The DiscordListener service 
2. The DiscordConsumer service
3. The `discord-message` queue on the `snapshot-exchange` of the CW rabbit-mq instance
4. The CW app database

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

## Architecture Diagram 
<img width="1149" alt="image" src="https://github.com/hicommonwealth/commonwealth/assets/36428666/abadbccf-e33b-4b70-abc4-69df9f8b3549">
