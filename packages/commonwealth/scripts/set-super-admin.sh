#!/bin/bash

# Default values
env_arg='local'
bool_flag=true

is_valid_env() {
  case "$1" in
    'frick'|'frack'|'beta'|'demo')
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_boolean() {
  case "$1" in
    'true'|'false')
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# Check number of arguments
case $# in
  2) # If there are two arguments
    if is_valid_env "$1" && is_boolean "$2"; then
      env_arg="$1"
      bool_flag="$2"
    else
      echo "Invalid arguments. The first argument must be one of 'frick', 'frack', 'beta', or 'demo' and the second argument must be either true or false."
      exit 1
    fi
    ;;
  1) # If there is one argument
    if is_valid_env "$1"; then
      env_arg="$1"
    elif is_boolean "$1"; then
      bool_flag="$1"
    else
      echo "Invalid argument. It must be one of 'frick', 'frack', 'beta', 'demo', true, or false."
      exit 1
    fi
    ;;
  0) # No arguments provided, defaults are already set
    ;;
  *) # More than 2 arguments
    echo "Invalid number of arguments. This script requires 0, 1, or 2 arguments."
    exit 1
    ;;
esac

# Output the values
echo "env_arg: $env_arg"
echo "bool_flag: $bool_flag"

# Execute TypeScript file with environment variables set based on the arguments
if [[ $env_arg != "local" ]]; then
    DATABASE_URL=$(heroku config:get DATABASE_URL -a commonwealth-$env_arg)
    echo "DATABASE_URL is set to: $DATABASE_URL"
    DATABASE_URL=$DATABASE_URL NODE_ENV=production tsx  ./scripts/set-super-admin.ts $bool_flag
else
    tsx  ./scripts/set-super-admin.ts $bool_flag
fi
