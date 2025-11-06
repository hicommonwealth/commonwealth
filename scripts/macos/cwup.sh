#!/bin/bash
set -e

# ---- Build custom Postgres image ----
#echo "🧱 Building cw-postgres image from cwpg-dockerfile..."
#container build -t cw-postgres -f cwpg-dockerfile .

ensure_network() {
  local name=$1
  if [ "$(container network inspect "$name" 2>/dev/null)" != "[]" ]; then
    echo "✓ $name"
  else
    container network create "$name"
  fi
}

ensure_volume() {
  local name=$1
  if [ "$(container volume inspect "$name" 2>/dev/null)" != "[]" ]; then
    echo "✓ $name"
  else
    container volume create "$name"
  fi
}

start_container() {
  local name=$1
  shift
  if ! [ "$(container inspect "$name" 2>/dev/null)" != "[]" ]; then
    echo "🚀 Starting $name..."
    container run -d --name "$name" "$@"
  fi
}

# ---- Create network and volumes ----
ensure_network cw-net
ensure_volume cw-rmq-data
ensure_volume cw-redis-data
ensure_volume cw-pg-data

# ---- Start containers ----
start_container cw-rmq --network cw-net -p 5672:5672 -p 15672:15672 -v cw-rmq-data:/var/lib/rabbitmq/mnesia rabbitmq:3.11.7-management
start_container cw-redis --network cw-net -p 6379:6379 -v cw-redis-data:/data redis:latest
start_container cw-pg --network cw-net -p 5432:5432 \
  -e POSTGRES_USER=commonwealth \
  -e POSTGRES_PASSWORD=edgeware \
  -e POSTGRES_DB=commonwealth \
  -v cw-pg-data:/var/lib/postgresql/pgdata \
  cw-postgres
