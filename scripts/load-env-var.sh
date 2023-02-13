#!/bin/bash

load-env-var () {
  if [ $# -eq 0 ]
    then
      echo "Must provide a .env file relative path";
      return;
  fi

  ENV_FILE_PATH="$(cd "$(dirname "$1}")"; pwd)/$(basename "$1")"
  echo "Grepping: $ENV_FILE_PATH"

  # shellcheck disable=SC2046
  if [[ $OSTYPE == 'darwin'* ]]; then
    export $(grep -v '^#' "$ENV_FILE_PATH" | xargs)
  else
    export $(grep -v '^#' "$ENV_FILE_PATH" | xargs -d '\n' -e)
  fi
}

if [ "${1}" != "--source-only" ]; then
    main "${@}"
fi

