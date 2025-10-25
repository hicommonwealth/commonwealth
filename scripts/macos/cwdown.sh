#!/bin/bash
set -e

echo "Stopping and removing containers..."
container rm -f cw-postgres || true
container rm -f cw-redis || true
container rm -f cw-rmq || true

echo "Removing network and volumes..."
container network rm cw-net || true
container volume rm cw-postgres-data || true
container volume rm cw-rmq-data || true
container volume rm cw-redis-data || true

echo "✅ All containers and network removed."
