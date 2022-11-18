# Using RabbitMQ
## Locally
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

## Remotely
Refer to the [Commonwealth README](/packages/commonwealth/README.md)


# Configuration Explained
In order to configure our RabbitMQ instance we utilize the Rascal package. The following is a description of the Rascal
configuration.

All the major Rascal configuration component names are defined as enums [here](./types/index.ts).

More Coming Soon...



