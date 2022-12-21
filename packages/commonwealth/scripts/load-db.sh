#!/bin/bash

ENV_FILE_PATH="$(cd "$(dirname ".env")"; pwd)/$(basename ".env")"
echo "Grepping: $ENV_FILE_PATH"

# shellcheck disable=SC2046
if [[ $OSTYPE == 'darwin'* ]]; then
  export $(grep -v '^#' "$ENV_FILE_PATH" | xargs)
else
  export $(grep -v '^#' "$ENV_FILE_PATH" | xargs -d '\n' -e)
fi

psql -d commonwealth -U commonwealth -W -f latest.dump
if [ "$ETH_ALCHEMY_API_KEY" ]
then
  ETH_ALCHEMY_URL="wss://eth-mainnet.g.alchemy.com/v2"
  psql -d commonwealth -U commonwealth -c "UPDATE \"ChainNodes\" SET url = '$ETH_ALCHEMY_URL/$ETH_ALCHEMY_API_KEY', alt_wallet_url = '$ETH_ALCHEMY_URL/$ETH_ALCHEMY_API_KEY' WHERE eth_chain_id = 1;"
else
  echo "You don't have the correct env var set so the Alchemy API urls were not updated"
fi
