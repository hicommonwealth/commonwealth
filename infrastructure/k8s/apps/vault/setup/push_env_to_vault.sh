#!/usr/bin/env bash

set -euo pipefail

VAULT_PATH="secret/baseenv" # Adjust to match your Vault mount/path
ENV_FILE=".env"              # Optional: your env file if not using current env

# Uncomment this to load from .env file
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Collect all environment variables and prepare for vault CLI
echo "Pushing environment variables to Vault at path: $VAULT_PATH"

VAULT_KV_ARGS=()
while IFS='=' read -r key value; do
  # Ignore empty keys or variables starting with underscore or bash internals
  [[ -z "$key" || "$key" == "_" || "$key" == "SHLVL" ]] && continue
  VAULT_KV_ARGS+=("$key=$value")
done < <(env)

vault kv put "$VAULT_PATH" "${VAULT_KV_ARGS[@]}"
echo "✔️  Environment variables successfully uploaded to Vault."
