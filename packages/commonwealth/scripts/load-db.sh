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
if [ "$ETH_ALCHEMY_URL" ] && [ "$ETH_ALCHEMY_ALT_WALLET_URL" ]; then
  psql -d commonwealth -U commonwealth -c "UPDATE \"ChainNodes\" SET url = '$ETH_ALCHEMY_URL', alt_wallet_url = '$ETH_ALCHEMY_ALT_WALLET_URL' WHERE url = 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_' OR url = 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr' OR url = 'wss://eth-mainnet.g.alchemy.com/v2/CAE5iDO8-QLOFwVRZU8PUtYJvqokWfws'"
else
  echo "You don't have ETH_ALCHEMY_URL and ETH_ALCHEMY_ALT_WALLET_URL env var set so the Alchemy urls were not updated"
fi
