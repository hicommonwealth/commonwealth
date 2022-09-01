# Preventing Data Loss

**Preventing data loss from the producer to the queue.**

1. For whatever data we are putting in the queue have a `Queued` number column in the database.
Publish the data. If the publish is successful increment the `Queued` column value. If the
publish fails then do not increment `Queued` and a background process will retry queueing the data
again at a later time. Once a record has a `Queued` value of 5 (subject to change) the system will
send a critical alert to the backend developers so that the issue can be manually resolve.
This method of ensuring consistency is used when we which to retain the data inserted into the
original database regardless of what happens to the publishing. For example, this is used in the
ChainEvents service when sending a ChainEntityCUD message to the main service. In that case, we
want to save the ChainEntity no matter what and we can deal with propagating the data to the other
services at a later time.
2. In a single transaction update the database (SHOULD ALWAYS BE FIRST INSIDE THE TXN) and then publish
the CUD message to the appropriate services. If the database update fails then the message will never
be published. If the publish fails then the database update is reverted. This method of ensuring
consistency is used when we don't want to keep the original data in the database if the change is not
propagated to the other services or when deleting data from the database. For example, this method is
used when deleting a chain. If we can't properly propagate the chain-deletion event to the other
services the deletion is reverted and the user must try deleting the chain again at a later time.


**Preventing data loss from the queue to the consumer**

Consumer a message from a queue and execute the processor function. If the processor function fails,
the consumer NACKs the message and assigns the message a retry strategy that re-queues it up to a certain
amount of times say 3. If after 3 times the consumer is unable to process the message, a critical alert is
sent to back-end developers and the message is placed in a Dead-Letter-Queue to be processed at a later time.

**Preventing data loss in the queue itself**
While we could replicate RabbitMQ memory the method is complex, expensive, and unnecessary considering that total
memory failure is extremely unlikely. Instead our system implements a recovery mechanism for recovering from a
'worst-case' scenario. In the event of a total RabbitMQ service failure, developers can run a script that compares
the service database and fills in any missing info. For example, the script would query all chain-event-types on the
chain-events service and then checks whether the id's of every single one of those appears in the main service database.

# General Info
This package is a plugin that allows chain-events to be used with rabbitmq. This plugin relies heavily on Rascal, a 
config drive wrapper for amqp.

Two main objects are exposed:

### Producer
This is the generic object that instantiates a Rascal instance and can be used to publish messages to arbitrary RabbitMQ
queues. The producer is the parent class of the RabbitMqHandler.

### RabbitMqHandler
This is a chain-events event handler (IEventHandler) used to publish events to rabbitmq.


# Queue Naming Conventions
- Queues that are bound to the **CreateDelete Exchange** are formatted like so: 
  - [object being created or deleted]CD[Destination service]Queue

# Setting up RabbitMQ
### Installation
- Follow instructions at https://www.rabbitmq.com/install-debian.html#apt to install Erlang and RabbitMQ make sure to install for the correct linux distribution!

### RabbitMQ Server Commands (stops erlang + rabbitmq)
- Start server: `sudo systemctl start rabbitmq-server`
- Check server status: `sudo systemctl status rabbitmq-server`
- Stop server: `sudo systemctl stop rabbitmq-server`

For more commands check: https://www.rabbitmq.com/rabbitmqctl.8.html#COMMANDS

### Create an admin RabbitMQ User:
1. `sudo rabbitmqctl add_user admin password`
2. `sudo rabbitmqctl set_user_tags admin administrator`
3. `sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"`


### IN THE EVENT OF A CRASH/FAILURE
First attempt to find the cause of the problem (overloaded queue, exchange failure, etc) and find a solution directly. 
The steps outlined below are the LAST resort in the event of catastrophic failure for which no apparent solution can be found.
1. Restart the RabbitMQ app with `sudo rabbitmqctl stop_app && sudo rabbitmqctl start_app`
   - Check if all is well again. If not, continue to step 2
2. Restart the both the RabbitMQ app and Erlang server with `sudo rabbitmqctl shutdown && sudo systemctl start rabbitmq-server`
   - If the problem still persists continue to step 3 to reset rabbitmq to its virgin state (Rascal automatically recreates vhosts/exchanges/queues)
3. Reset the RabbitMQ app with `sudo rabbitmqctl stop_app && sudo rabbitmqctl reset`. Then make sure to recreate the admin user
using the steps outlined in **Create an admin RabbitMQ User**.
   
If the problem persists, then it may not originate from RabbitMQ but from Erlang or some other related service.
