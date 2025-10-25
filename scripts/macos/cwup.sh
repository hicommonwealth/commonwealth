#!/bin/bash
set -e

echo "🔧 Ensuring network and volumes exist..."
container network create cw-net 2>/dev/null || true
container volume create cw-rmq-data 2>/dev/null || true
container volume create cw-redis-data 2>/dev/null || true
container volume create cw-postgres-data 2>/dev/null || true

# ---- Build custom Postgres image ----
#echo "🧱 Building cw-postgres image from cwpg-dockerfile..."
#container build -t cw-postgres -f cwpg-dockerfile .

# ---- Start services ----
echo "🐇 Starting cw-rmq..."
container run -d \
  --name cw-rmq \
  --network cw-net \
  -p 5672:5672 \
  -p 15672:15672 \
  -v cw-rmq-data:/var/lib/rabbitmq/mnesia \
  rabbitmq:3.11.7-management || true

echo "🧠 Starting cw-redis..."
container run -d \
  --name cw-redis \
  --network cw-net \
  -p 6379:6379 \
  -v cw-redis-data:/data \
  redis:latest || true

echo "🐘 Starting cw-postgres..."
container run -d \
  --name cw-postgres \
  --network cw-net \
  -p 5432:5432 \
  -e POSTGRES_USER=commonwealth \
  -e POSTGRES_PASSWORD=edgeware \
  -e POSTGRES_DB=commonwealth \
  -v cw-postgres-data:/var/lib/postgresql/pgdata \
  cw-postgres || true

echo "✅ All containers are up. Use 'container ls' to check."
