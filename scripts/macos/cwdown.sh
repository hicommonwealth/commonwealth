#!/bin/bash
set -e

echo "Removing containers..."
container rm -f cw-pg || true
container rm -f cw-redis || true
container rm -f cw-rmq || true

echo "Removing network and volumes..."
container network rm cw-net || true
container volume rm cw-pg-data || true
container volume rm cw-rmq-data || true
container volume rm cw-redis-data || true
