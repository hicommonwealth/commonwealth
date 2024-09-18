#!/bin/bash

datadog-agent run &
/opt/datadog-agent/embedded/bin/trace-agent --config=/etc/datadog-agent/datadog.yaml &
/opt/datadog-agent/embedded/bin/process-agent --config=/etc/datadog-agent/datadog.yaml &
NODE_ENV=production node --import=extensionless/register --enable-source-maps ./build/server.js