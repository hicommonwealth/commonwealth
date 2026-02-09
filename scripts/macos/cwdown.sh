#!/bin/bash
set -e

echo "Removing containers..."
container rm -f cw-pg || true
container rm -f cw-redis || true
container rm -f cw-rmq || true

echo "Removing network and volumes..."
container network rm cw-net || true
rm -rf "$HOME/.container-volumes/cw-pg-data" || true
rm -rf "$HOME/.container-volumes/cw-rmq-data" || true
rm -rf "$HOME/.container-volumes/cw-redis-data" || true
