Please direct unanswered questions about the Chain-Event Services to Timothee or Jake.

# Architecture Diagram
![chain-events-architecture drawio (2)](https://user-images.githubusercontent.com/62490329/222942650-2915985d-15a3-4f4a-bdb1-2d09daefd87a.png)

# Servers

The chain-events service is split into 3 different servers as follows.
[Diagram coming Soon]

## [ChainSubscriber][12]
- Source of all blockchain data
- Where chain-event listeners (see [Listeners.ts][1]) actually execute
- Can be executed with `yarn start-subscriber`

#### Execution flow:
1. The server periodically queries the CW App API to retrieve the protocols (and their chain) it should be monitoring for events. See the [`REPEAT_TIME` env var][16] for info on how to control how often the query executes (currently set to every 10 minutes)
2. A listener is started for every retrieved protocol. This means WebSocket connections are opened to all the different blockchains and event listening begins.
3. Listeners receive and process events. This process includes enriching the event with other data, removing unnecessary data, and formatting so that every event adheres to the same [CWEvent][2] interface.
4. Once an event is processed it is sent via the [ChainEventsQueue][3] to the ChainEventsConsumer.

## [ChainEventsConsumer][13]
- All database operations relevant to chain-events occur on this server
- Can be executed with `yarn start-consumer`

#### Execution flow:
1. Consumes messages from the ChainEventsQueue (linked above).
2. Each event is saved to the database in the [ChainEvents table][4] by the [Storage handler][5]
    - For events that are related to on-chain proposals, a [ChainEntity][6] is created or updated. Every new ChainEntity is published to the [ChainEntityCUDMainQueue][7] by the [Entity Archiver][8]
3. Events are published to the [ChainEventNotificationsCUDMainQueue][9] by the [Notification handler][10].

## [App][14]
- Can be executed with `yarn start-app`

A simple express server that currently hosts 2 routes:

- entities: formerly `bulkEntities`, this route fetches entities to be merged with ChainEntityMeta on the client
- events: formerly, `viewChainActivity` retrieves all chain-events for a specific chain

In order to authenticate users the ChainEvents service has the same JWT_SECRET which allows it to decode JWTs created by the main service.

# Important Scripts
## [Migrating Events/Entities][11]
Given a chain this script searches every existing block for chain-events (thus chain-entities) and adds any new/missing events to the database. This script is often used to onboard new communities that have on-chain contracts and want their proposals embedded on commonwealth.im. It is also used in the case of extended chain-events subscriber downtime in which case events may have been missed.

### Requirements
- Running RabbitMQ instance. If running the script locally you can use `yarn start-rmq` from root to start a local RabbitMQ instance with Docker (requires Docker to be installed).
- Running CW app. You can run the app with `yarn start` from `packages/commonwealth`

### Running the Script
#### Locally
1. Navigate to the chain-events package.
2. Run `CHAIN_ID=[some_chain_id] yarn migrate-events` to migrate events for a specific chain or `yarn migrate-events` to migrate events for all chains we have listeners for.
#### Heroku
1. Run Heroku Bash with `heroku run bash -a [app-name]`.
2. In the bash terminal that opens follow the same two steps as above.

## [Enforcing Chain-Event Data Consistency][15]
This script pulls entities from the given chain-events database and populates the `ChainEntityMeta` table in the CW database. Thus this script should be run from `packages/commonwealth` (if running locally) or from the staging/production environment/app e.g. `heroku run bash -a commonwealth-staging`. So when might we use this?
- When a new chain is added to the database and we want to retrieve historical proposals/entities.
- When switching between chain-event services as sources of entities. For example, suppose I have been running chain-events locally but now I want to use `chain-events-staging` to retrieve proposals. I would need to update my `ENTITIES_URL` and follow the instructions below to retrieve the new entities and copy them into my local CW database.
#### Locally
- If you want to copy chain-entities from your local chain-events database use `yarn sync-entities-local`. 
- If you want to copy chain-entities from a Heroku app to your local database use `yarn sync-entities [app-name]`
#### Heroku
1. Run Heroku Bash with `heroku run bash -a [app-name]`.
2. `yarn sync-entities [app-name]`

## Vultr Scripts


[1]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/src/Listener.ts
[2]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/src/interfaces.ts#L98
[3]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/common-common/src/rabbitmq/types/index.ts#L74
[4]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/services/database/models/chain_event.ts
[5]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/services/ChainEventsConsumer/ChainEventHandlers/storage.ts#L139
[6]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/services/database/models/chain_entity.ts
[7]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/common-common/src/rabbitmq/types/index.ts#L75
[8]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/services/ChainEventsConsumer/ChainEventHandlers/entityArchival.ts#L96
[9]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/common-common/src/rabbitmq/types/index.ts#L76
[10]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/services/ChainEventsConsumer/ChainEventHandlers/notification.ts#L62
[11]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/scripts/migrateChainEntities.ts
[12]: https://github.com/hicommonwealth/commonwealth/tree/master/packages/chain-events/services/ChainSubscriber
[13]: https://github.com/hicommonwealth/commonwealth/tree/master/packages/chain-events/services/ChainEventsConsumer
[14]: https://github.com/hicommonwealth/commonwealth/tree/master/packages/chain-events/services/app
[15]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/server/scripts/enforceDataConsistency.ts
[16]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events%20Environment%20Variables#both