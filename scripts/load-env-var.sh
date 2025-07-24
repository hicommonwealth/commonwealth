#!/bin/bash

load-env-var () {
  if [ $# -eq 0 ]
    then
      echo "Must provide a .env file relative path";
      return;
  fi

  ENV_FILE_PATH="$(cd "$(dirname "$1")"; pwd)/$(basename "$1")"
  echo "Grepping: $ENV_FILE_PATH"

  # Check if the file exists
  if [ ! -f "$ENV_FILE_PATH" ]; then
    echo "Warning: .env file not found at $ENV_FILE_PATH"
    return
  fi

  # Read and validate environment variables
  while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi

    # Check if line contains valid env var format (KEY=VALUE)
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      export "$line"
    else
      echo "Warning: Skipping invalid environment variable format: $line"
    fi
  done < "$ENV_FILE_PATH"
}

if [ "${1}" != "--source-only" ]; then
    load-env-var "${@}"
fi

