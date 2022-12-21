#!/bin/bash


. ../../scripts/load-env-var.sh --source-only

load-env-var '.env';

PGPASSWORD=$DB_PASSWORD psql -d commonwealth -U commonwealth -f latest.dump;

if [ "$ETH_ALCHEMY_API_KEY" ]
then
  ETH_ALCHEMY_URL="wss://eth-mainnet.g.alchemy.com/v2"
  PGPASSWORD=$DB_PASSWORD psql -d commonwealth -U commonwealth -c "UPDATE \"ChainNodes\" SET url = '$ETH_ALCHEMY_URL/$ETH_ALCHEMY_API_KEY', alt_wallet_url = '$ETH_ALCHEMY_URL/$ETH_ALCHEMY_API_KEY' WHERE eth_chain_id = 1;"
else
  echo "You don't have the correct env var set so the Alchemy API urls were not updated"
fi
