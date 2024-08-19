# RabbitMQ

_More RabbitMQ info can be found in the README located at `libs/adapters/src/rabbitmq/README.md`._

## Contents

- [Overview](#overview)
- [Rascal](#rascal)
- [Policies & error handling](#policies--error-handling)
  * [Idempotency](#idempotency)
- [Preventing data loss](#preventing-data-loss)
  * [Preventing data inconsistencies across deployments and migrations](#preventing-data-inconsistencies-across-deployments-and-migrations)
- [Management panel](#management-panel)
  * [Access](#access)
  * [Queues](#queues)
- [Change Log](#change-log)

## Overview

Common implements an event-based architecture, allowing services to communicate asynchronously. RabbitMQ is a message brokerage system for handling this asynchronous communication, by sending and delivering messages through queues and exchanges. Queues receive messages from routing exchanges via binding keys. Messages are then passed on to any consumer services which subscribe to a given queue. At each stage, acknowledgments of receipt are passed backward, allowing services to move on, and queues to clear.

There are many kinds of exchanges, but the main ones used at Common are fanout and topic exchanges. A fanout exchange sends copies of every message it receives to all subscribed queues. A topic exchange routes messages to specific queues based on partial matches between routing keys (passed via messages) and binding keys (which link exchanges to queues).

A proper data flow between the services requires 3 essential parts. (See the RabbitMQ [README](../libs/adapters/src/rabbitmq/README.md) for examples.)

1. A message producer, using the `publish` RabbitMQController methods to push messages to a queue.
2. A queue linked to an exchange.
3. A message consumer.
    1. The consumers subscribe to a queue or in our case a Rascal Subscription using the `subscribe` RabbitMQController method. All of the consumer functions can be found in the `MessageProcessor` directories.

To ensure consistent data sharing over queues, every message that is sent to a queue is typed. This type is checked on the receiving end. If a message with an unknown type is sent to a queue, the receiver/processor will send the message to a `deadLetterQueue`.

As part of our hexagonal ports-and-adapters architecture, we define interfaces for external services. For message brokers specifically (including, but not limited to RabbitMQ) we use a [`Broker` port](../libs/core/src/ports/interfaces.ts)—a generic publish-subscribe-initialize interface.

## Rascal

To manage RabbitMQ configuration and connections we use [Rascal](https://www.npmjs.com/package/rascal). Rascal publications and subscriptions are abstractions over RabbitMQ exchanges' & queues' inputs and outputs, respectively. The current Rascal/RabbitMQ configuration can be found [here](../libs/adapters/src/rabbitmq/rabbitMQConfig.ts).

## Policies & error handling

When subscribing to Rascal, you must provide a policy. A policy is a strictly typed object that encodes functions to handle various message types. As part of that policy, you can define a retry strategy for that policy when you subscribe.

Several retry strategies exist by default; they are only unavailable if a RetryStrategy is defined for a policy without use of the `buildRetryStrategy` function.

Strategies include:

- `deadLetterQueue`: Houses all unprocessable events (messages)
  - If the event's schema is incorrectly structured, the event is deadLetterQueued
  - If other strategies fail, our strategy of last resort is to try three times, then send to deadLetterQueue
- `customRetryStrategy`: Custom retry strategies may be provided to handle edgecases; they are written as conditional statements within the policy.

### Ordering

RabbitMQ is not inherently ordered, insofar as retry strategies may alter queue order by requeing messages. Therefore, the queue cannot be relied upon as preserving the initial order of sending.

### Idempotency

RMQ policies should always be idempotent.

We guarantee at-least-once delivery to consumers, but cannot guarantee exactly-once delivery. Events should therefore be idempotent, such that the event can be delivered and processed multiple times without repeatedly updating end-state. This requires a strategy to ensure proper handling of duplicate deliveries.

One strategy involves caching and de-duplicating of incoming events. A preferable strategy involves a check, by event handlers, as to whether the desired end-state of the event has already been reached. An idempotent event handler would check, for instance, if a thread has already been stored on-chain before attempting to store it.

## Preventing data loss

Our system implements a Transactional Outbox pattern for recovering from total RabbitMQ failures (e.g. cloud outages). Events are stored in an `Outbox` table, functioning essentially as an event log, so that they can be replayed and reprocessed (re-queued) post-failure.

Data placed in the Outbox table includes a `relayed` number column in the database. If the publication of data is successful, the `relayed` column value is incremented. If the publication fails, `relayed` is not incremented, and a background process will retry queueing the data again at a later time. Once a record has a `relayed` value of 5 (subject to change) the system will send a critical alert to the backend developers so that the issue can be manually resolved. This method of ensuring consistency is used when we wish to retain the data inserted into the original database regardless of what happens to the publishing.

## Management panel

### Access

The local Docker RabbitMQ can be accessed at <http://127.0.0.1:15672/>. The username is 'guest' and the password is 'guest'.

To access the RabbitMQ management panel, go to the Resources tab on the Heroku App dashboard. Select the CLOUDAMQP resource and in the window that opens select the RabbitMQ Management button.

### Queues

The Queues tab shows a list of all the existing queues. Columns:

- `State`
  - Will usually vary between 'idle' and 'ready'. Either of these values is completely normal. If state is neither of these then contact an admin immediately.
- `Ready`
  - The number of messages that are ready to be taken out of the queue by a consumer.
- `Unacked`
  - The number of messages that consumers have taken from the queue but not acknowledged. This indicates a consumer is busy processing messages or is stuck and is not acking messages. A large number of unacked messages may indicate there is a problem.
- `Total`
  - The sum of `Ready` and `Unacked`

If you click on a specific queue there are several things you can do:

- Get a message
  - You can pull a message from the queue. Depending on the option that you pick the message be or may not be re-queued.
- Delete Queue
  - You can delete the queue and all of its messages
- Purge Messages
  - You can empty a queue out without deleting it.
- Publish Messages
  - You can publish messages to the queue.

## Change Log

- 240611: Refreshed by Graham Johnson in consultation with Timothee Legros.
- 240415: RabbitMQ files (`RAbbitMQ-Overview.md`, `RabbitMQ-Management-Panel.md`, `RabbitMQ-Preventing-Data-Loss.md`, `RAbbitMQ-FAQ`) consolidated under one file.
- 231013: Flagged by Graham Johnson for consolidation with other RabbitMQ files.
- 230124: Authored by Forest Mars.
