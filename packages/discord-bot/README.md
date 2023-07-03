# Discord Bot 

This package provides services to listen to forum channels that the CW discord bot is active in and publish forum posts to Commonwealth.

The discord bot has two main services

1. Discord Listener
    - Listens to Discord via the bot's token access
    - Provides minimal filtering of what messages are relevant to CW communities.
    - Publishes consolidated messages to a queue for consumtion 

2. Discord Consumer(WIP)
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
    - Set up RMQ variables for given environment(not required for local)
3. If running local, run `yarn start-rmq` from root directory
4. Run `yarn start` from discord-bot directory