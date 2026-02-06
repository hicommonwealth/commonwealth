#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ensure_network() {
  local name=$1

  # Check if network truly exists (both listable and inspectable)
  local exists=false
  if container network ls --format '{{.Name}}' 2>/dev/null | grep -qx "$name"; then
    if container network inspect "$name" >/dev/null 2>&1; then
      exists=true
    fi
  fi

  if [ "$exists" = true ]; then
    echo "✓ Network $name exists"
  else
    # Remove any stale references before creating
    container network rm "$name" 2>/dev/null || true
    echo "➕ Creating network $name..."
    container network create "$name"
  fi
}

ensure_volume_dir() {
  local path=$1

  if [ -d "$path" ]; then
    echo "✓ Volume dir $path exists"
  else
    echo "➕ Creating volume dir $path..."
    mkdir -p "$path"
  fi
}

start_container() {
  local name=$1
  shift

  local inspect_output
  if ! inspect_output=$(container inspect "$name" 2>/dev/null); then
    echo "🚀 Creating and starting $name..."
    container run -d --name "$name" "$@"
    return
  fi

  if [ -z "$inspect_output" ] || [ "$inspect_output" = "[]" ]; then
    echo "🚀 Creating and starting $name (was empty)..."
    container run -d --name "$name" "$@"
    return
  fi

  local status
  status=$(echo "$inspect_output" | jq -r '.[0].status // "unknown"')

  if [ "$status" != "running" ]; then
    echo "▶️  Starting existing container $name..."
    container start "$name"
  else
    echo "✅ $name is already running"
  fi
}

ensure_image() {
  local name=$1
  local dockerfile=$2

  if container image inspect "$name" >/dev/null 2>&1; then
    echo "✓ Image $name exists"
  else
    echo "🧱 Building image $name..."
    container build -t "$name" -f "$dockerfile" "$SCRIPT_DIR"
  fi
}

# ---- Build custom images ----
ensure_image cw-postgres "$SCRIPT_DIR/cwpg-dockerfile"

# ---- Create network and volumes ----
ensure_network cw-net
VOLUME_BASE="$HOME/.container-volumes"
ensure_volume_dir "$VOLUME_BASE/cw-rmq-data"
ensure_volume_dir "$VOLUME_BASE/cw-redis-data"
ensure_volume_dir "$VOLUME_BASE/cw-pg-data"
chmod -R 777 "$VOLUME_BASE/cw-rmq-data" "$VOLUME_BASE/cw-redis-data" "$VOLUME_BASE/cw-pg-data" || true

# ---- Start containers ----
start_container cw-rmq --network cw-net -p 5672:5672 -p 15672:15672 -v "$VOLUME_BASE/cw-rmq-data:/var/lib/rabbitmq/mnesia" rabbitmq:3.11.7-management
start_container cw-redis --network cw-net -p 6379:6379 -v "$VOLUME_BASE/cw-redis-data:/data" redis:latest
start_container cw-pg --network cw-net -p 5432:5432 \
  -e POSTGRES_USER=commonwealth \
  -e POSTGRES_PASSWORD=edgeware \
  -e POSTGRES_DB=commonwealth \
  -e PGDATA=/var/lib/postgresql/pgdata \
  -v "$VOLUME_BASE/cw-pg-data:/var/lib/postgresql" \
  cw-postgres
