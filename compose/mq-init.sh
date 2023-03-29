#!/bin/sh

# Start RabbitMQ server in the background
rabbitmq-server &

# Get the RabbitMQ server process ID
rabbitmq_pid=$!

# Wait for RabbitMQ server to start
while ! nc -z local-rabbitmq 5672; do
  sleep 0.1
done

# Create user
rabbitmqctl add_user commonwealth edgeware
rabbitmqctl add_user guest guest

# Set user tags
rabbitmqctl set_user_tags commonwealth administrator
rabbitmqctl set_user_tags guest administrator

# Set permissions
rabbitmqctl set_permissions -p / commonwealth ".*" ".*" ".*"
rabbitmqctl set_permissions -p / guest ".*" ".*" ".*"

echo "New user 'commonwealth' with 'administrator' tag and full permissions created."

# Wait for RabbitMQ server to stop
wait $rabbitmq_pid