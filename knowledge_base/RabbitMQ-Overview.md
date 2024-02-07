[WIP]
More RabbitMQ info can be found in the README located at [`libs/adapters/src/rabbitmq/README.md`][2]

# Important Definitions

- RabbitMQ Exchange
  - Can be thought of as a ‘router’ for messages. Queues receive messages from exchanges based on how the exchange routes messages. There are multiple types of exchanges but the 2 main ones we use are fanout and topic. A fanout exchange sends every message it receives to all of the subscribed queues. A topic exchange routes messages to specific queues based on a routing key i.e. a queue defines a specific key and the exchange will route messages to that queue if the key defined in the message matches the key of the queue.
- Rascal Publication/Subscription
  - Abstractions over RabbitMQ exchanges/queues. You can think of a Rascal Publication as the ‘input’ end of an exchange or queue and the Rascal Subscription as the ‘output’ end of a queue.

# Overview

The implemented system utilizes an event-based architecture which means that the services communicate asynchronously. To achieve this we use RabbitMQ which allows the services to send messages to each other without waiting for the opposing service to respond. In other words, when a service sends a message and receives an acknowledgment from RabbitMQ that that message has been queued up the service can forget the message ever existed.

A proper data flow between the services requires 3 essential parts:

1. A message producer.
    1. The producers use the `publish` or `safePublish` RabbitMQController methods to push messages to a queue.
    2. See the RabbitMQ [README][5] for examples of producers
2. A queue.
    1. A queue linked to an exchange. See the RabbitMQ [README][5] for a description of the queues
3. A message consumer.
    1. The consumers subscribe to a queue or in our case a Rascal Subscription using the `startSubscription` RabbitMQController method.
    2. ALL of the consumer functions can be found in MessageProcessor directories.
    3. See the RabbitMQ [README][5] for examples of consumers

To ensure consistent data sharing over queues, every message that is sent to a queue is typed. This type is checked on the receiving end. If a message with an unknown type is sent to a queue, the receiver/processor will send the message to a deadLetterQueue.

**One of the most important aspects of this setup is we ensure no data (messages) are ever lost. To see an explanation of how this is addressed see [Preventing Data Loss][3]**

# Rascal

In order to manage RabbitMQ configuration and connections we use [Rascal][1]. The current Rascal/RabbitMQ configuration can be found [here][4].

[1]: https://www.npmjs.com/package/rascal
[2]: https://github.com/hicommonwealth/commonwealth/tree/master/libs/adapters/src/rabbitmq
[3]: https://github.com/hicommonwealth/commonwealth/wiki/RabbitMQ%20Preventing%20Data%20Loss
[4]: https://github.com/hicommonwealth/commonwealth/blob/master/libs/adapters/src/rabbitmq/rabbitMQConfig.ts
[5]: https://github.com/hicommonwealth/commonwealth/tree/master/libs/adapters/src/rabbitmq

## Change Log

- 231013: Flagged by Graham Johnson for consolidation with other RabbitMQ files.
- 230123: Authored by Timothee Legros.
