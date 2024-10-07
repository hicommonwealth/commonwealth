#!/bin/sh

datadog-agent run &
if [ "$APP_ENV" = "production" ]; then
  /opt/datadog-agent/embedded/bin/trace-agent --config=/etc/datadog-agent/datadog.yaml &
  /opt/datadog-agent/embedded/bin/process-agent --config=/etc/datadog-agent/datadog.yaml &
done

# Check if a command is provided
if [ -z "$1" ]; then
  echo "Error: No command provided to run. Usage: $0 <your_command>"
  exit 1
fi

exec "$@"