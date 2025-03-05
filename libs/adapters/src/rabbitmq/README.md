# Using RabbitMQ

## Locally via Docker

- Simply run `pnpm start-rmq` from the root of the repo. This will download and run a rabbitmq image on your local machine inside a docker container. Make sure you have docker installed locally before running and that rabbitmq, as configured below, is NOT running simultaneously.

## Locally

### Installation

- You can install and run RabbitMQ with just one command:

Prerequisite: Docker installed and running.

Then run

```
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.11-management
```

This will install and run RabbitMQ in a docker container, exposing it on your local port `15672`.
Running this command a second time will not reinstall it, but just spin up the container.

To check its running you can go to `http://localhost:15672` in your browser.
Login to the dasboard with username: `guest` password: `guest`

NB: If running with docker, the instance running on your machine is at `amqp://localhost`

If not using Docker, follow the steps below:

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
