#!/bin/sh

datadog-agent run &
/opt/datadog-agent/embedded/bin/trace-agent run &
/opt/datadog-agent/embedded/bin/process-agent run &
NODE_ENV=production node --import=extensionless/register --enable-source-maps ./build/server.js