# RabbitMQ

More RabbitMQ info can be found in the README located at `libs/adapters/src/rabbitmq/README.md`.

## Contents

## Important Definitions

- RabbitMQ Exchange: A 'router' for messages. Queues receive messages from exchanges based on how the exchange routes messages. There are multiple types of exchanges but the two main ones we use are fanout and topic. A fanout exchange sends every message it receives to all of the subscribed queues. A topic exchange routes messages to specific queues based on a routing key i.e. a queue defines a specific key and the exchange will route messages to that queue if the key defined in the message matches the key of the queue.
- Rascal publications and subscriptions: Abstractions over RabbitMQ exchanges' & queues' inputs and outputs, respectively.

## Overview

The implemented system utilizes an event-based architecture which means that the services communicate asynchronously. To achieve this we use RabbitMQ which allows the services to send messages to each other without waiting for the opposing service to respond. In other words, when a service sends a message and receives an acknowledgment from RabbitMQ that that message has been queued up the service can forget the message ever existed.

As part of our hexagonal ports-and-adapters architecture, we define interfaces for external services. For message brokers specifically (including, but not limited to RabbitMQ) we use a [`Broker` port](../libs/core/src/ports/interfaces.ts)—a generic publish-subscribe-initialize interface.

A proper data flow between the services requires 3 essential parts:

1. A message producer.
    1. The producers use the `publish` RabbitMQController methods to push messages to a queue.
    2. See the RabbitMQ [README](../libs/adapters/src/rabbitmq/README.md) for examples of producers.
2. A queue.
    1. A queue linked to an exchange. See the RabbitMQ [README](../libs/adapters/src/rabbitmq/README.md) for a description of the queues
3. A message consumer.
    1. The consumers subscribe to a queue or in our case a Rascal Subscription using the `subscribe` RabbitMQController method.
    2. ALL of the consumer functions can be found in MessageProcessor directories.
    3. See the RabbitMQ [README](../libs/adapters/src/rabbitmq/README.md) for examples of consumers

To ensure consistent data sharing over queues, every message that is sent to a queue is typed. This type is checked on the receiving end. If a message with an unknown type is sent to a queue, the receiver/processor will send the message to a deadLetterQueue.

**NB:** One of the most important aspects of this setup is we ensure no data (messages) are ever lost. To see an explanation of how this is addressed see [Preventing Data Loss](#preventing-data-loss).

## Rascal

In order to manage RabbitMQ configuration and connections we use [Rascal](https://www.npmjs.com/package/rascal). The current Rascal/RabbitMQ configuration can be found [here](../libs/adapters/src/rabbitmq/rabbitMQConfig.ts).

## Management Panel

### Access

The local Docker RabbitMQ can be accessed at <http://127.0.0.1:15672/>. The username is 'guest' and the password is 'guest'.

To access the RabbitMQ management panel, go to the Resources tab on the Heroku App dashboard. Select the CLOUDAMQP resource and in the window that opens select the RabbitMQ Management button.

### Queues

The Queues tab shows a list of all the existing queues. Columns:

- State
  - Will usually vary between 'idle' and 'ready'. Either of these values is completely normal. If state is neither of these then contact an admin immediately.
- Ready
  - The number of messages that are ready to be taken out of the queue by a consumer.
- Unacked
  - The number of messages that consumers have taken from the queue but not acknowledged. This indicates a consumer is busy processing messages or is stuck and is not acking messages. A large number of unacked messages may indicate there is a problem.
- Total
  - Ready + Unacked

If you click on a specific queue there are several things you can do:

- Get a message
  - You can pull a message from the queue. Depending on the option that you pick the message be or may not be re-queued.
- Delete Queue
  - You can delete the queue and all of its messages
- Purge Messages
  - You can empty a queue out without deleting it.
- Publish Messages
  - You can publish messages to the queue.

## Error handling

RabbitMQ is not inherently ordered. Some retry strategies requeue messages; this alters their order, such that the queue cannot be relied upon as preserving the initial order of sending.

### Idempotency

RMQ policies should always be idempotent.

We guarantee at-least-once delivery to consumers, but cannot guarantee exactly-once delivery. Events should therefore be idempotent, such that the event can be delivered and processed multiple times without repeatedly updating end-state. This requires a strategy to ensure proper handling of duplicate deliveries.

One strategy is caching and de-duplication of incoming events. A preferable strategy involves a check, by event handlers, as to whether the desired end-state of the event has already been reached. An idempotent event handler would check, for instance, if a thread has already been stored on-chain before attempting to store it.

## Preventing Data Loss

### Preventing data loss from the producer to the queue

1. For whatever data we are putting in the queue have a `relayed` number column in the database.
Publish the data. If the publish is successful increment the `relayed` column value. If the
publish fails then do not increment `relayed` and a background process will retry queueing the data again at a later time. Once a record has a `relayed` value of 5 (subject to change) the system will send a critical alert to the backend developers so that the issue can be manually resolved. This method of ensuring consistency is used when we wish to retain the data inserted into the original database regardless of what happens to the publishing. For example, this is used in the ChainEvents service when sending a ChainEntityCUD message to the main service. In that case, we want to save the ChainEntity no matter what and we can deal with propagating the data to the other services at a later time.

2. In a single transaction update the database (SHOULD ALWAYS BE FIRST INSIDE THE TXN) and then publish the CUD message to the appropriate services. If the database update fails then the message will never be published. If the publish fails then the database update is reverted. This method of ensuring consistency is used when we don't want to keep the original data in the database if the change is not propagated to the other services or when deleting data from the database. For example, this method is used when deleting a chain. If we can't properly propagate the chain-deletion event to the other services the deletion is reverted and the user must try deleting the chain again at a later time.

### Preventing data loss from the queue to the consumer

Consume a message from a queue and execute the processor function. If the processor function fails, the consumer NACKs the message and assigns the message a retry strategy that re-queues it up to a certain amount of times say 3. If after 3 times the consumer is unable to process the message, a critical alert is sent to back-end developers and the message is placed in a Dead-Letter-Queue to be processed at a later time.

### Preventing data loss in the queue itself

Our system implements a Transactional Outbox pattern for recovering from total RabbitMQ failures (e.g. cloud outages). Events are stored in an `Outbox` table, functioning essentially as an event log, so that they can be replayed and reprocessed (re-queued) post-failure.

### Preventing data inconsistencies across deployments and migrations

Direct write/update access should be restricted for any tables that share data with another service. No connection except the app itself (sequelize) should have write access to the database. As part of the deployment process, at the end of each migration execution, the script described above is executed to ensure that any changes made within migrations are copied over to the databases of the other services ([https://devcenter.heroku.com/articles/release-phase#specifying-release-phase-tasks](https://devcenter.heroku.com/articles/release-phase#specifying-release-phase-tasks)).

## Change Log

- 240611: Refreshed by Graham Johnson in consultation with Timothee Legros.
- 240415: RabbitMQ files (`RAbbitMQ-Overview.md`, `RabbitMQ-Management-Panel.md`, `RabbitMQ-Preventing-Data-Loss.md`, `RAbbitMQ-FAQ`) consolidated under one file.
- 231013: Flagged by Graham Johnson for consolidation with other RabbitMQ files.
- 230124: Authored by Forest Mars.
