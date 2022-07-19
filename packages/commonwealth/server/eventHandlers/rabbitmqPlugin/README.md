# ce-rabbitmq-plugin
This package is a plugin that allows chain-events to be used with rabbitmq. This plugin relies heavily on Rascal, a 
config drive wrapper for amqp.

Two main objects are exposed:

### Producer
This is the generic object that instantiates a Rascal instance and can be used to publish messages to arbitrary RabbitMQ
queues. The producer is the parent class of the RabbitMqHandler.

### RabbitMqHandler
This is a chain-events event handler (IEventHandler) used to publish events to rabbitmq.


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
