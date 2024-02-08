# Access

1. See [this FAQ][1] for instructions on getting your RabbitMQ Management panel URL.
2. If you are running a local instance of RabbitMQ the username is 'guest' and the password is 'guest'.

# Queues

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

[1]: https://github.com/hicommonwealth/commonwealth/wiki/RabbitMQ-FAQ#how-do-i-access-the-correct-rabbitmq-management-dashboard

## Change Log

- 231013: Flagged by Graham Johnson for consolidation with other RabbitMQ files.
- 230122: Authored by Timothee Legros.
