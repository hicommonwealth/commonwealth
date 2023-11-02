# Rabbit MQ: Preventing Data Loss

## Preventing data loss from the producer to the queue

1. For whatever data we are putting in the queue have a `Queued` number column in the database.
Publish the data. If the publish is successful increment the `Queued` column value. If the
publish fails then do not increment `Queued` and a background process will retry queueing the data again at a later time. Once a record has a `Queued` value of 5 (subject to change) the system will send a critical alert to the backend developers so that the issue can be manually resolved. This method of ensuring consistency is used when we wish to retain the data inserted into the original database regardless of what happens to the publishing. For example, this is used in the ChainEvents service when sending a ChainEntityCUD message to the main service. In that case, we want to save the ChainEntity no matter what and we can deal with propagating the data to the other services at a later time.
2. In a single transaction update the database (SHOULD ALWAYS BE FIRST INSIDE THE TXN) and then publish the CUD message to the appropriate services. If the database update fails then the message will never be published. If the publish fails then the database update is reverted. This method of ensuring consistency is used when we don't want to keep the original data in the database if the change is not propagated to the other services or when deleting data from the database. For example, this method is used when deleting a chain. If we can't properly propagate the chain-deletion event to the other services the deletion is reverted and the user must try deleting the chain again at a later time.

## Preventing data loss from the queue to the consumer

Consume a message from a queue and execute the processor function. If the processor function fails, the consumer NACKs the message and assigns the message a retry strategy that re-queues it up to a certain amount of times say 3. If after 3 times the consumer is unable to process the message, a critical alert is sent to back-end developers and the message is placed in a Dead-Letter-Queue to be processed at a later time.

## Preventing data loss in the queue itself

While we could replicate RabbitMQ memory the method is complex, expensive, and unnecessary considering that total memory failure is extremely unlikely. Instead, our system implements a recovery mechanism for recovering from a 'worst-case' scenario. In the event of a total RabbitMQ service failure, developers can run a script that compares the service database and fills in any missing info. For example, the script would query all chain-event-types on the chain-events service and then checks whether the IDs of every single one of those appear in the main service database.

## Preventing data inconsistencies across deployments and migrations

Direct write/update access should be restricted for any tables that share data with another service. No connection except the app itself (sequelize) should have write access to the database. As part of the deployment process, at the end of each migration execution, the script described above is executed to ensure that any changes made within migrations are copied over to the databases of the other services ([https://devcenter.heroku.com/articles/release-phase#specifying-release-phase-tasks](https://devcenter.heroku.com/articles/release-phase#specifying-release-phase-tasks)).

## Change Log

- 231013: Flagged by Graham Johnson for consolidation with other RabbitMQ files.
- 230123: Authored by Timothee Legros.
