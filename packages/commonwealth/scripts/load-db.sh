#!/bin/bash


# this path is relative to the location from which the script is called i.e. /commonwealth root rather than the path
# from which the script exists i.e. commonwealth/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '.env';

if [[ -z "${PGPASSWORD}" ]]; then
  PGPASSWORD="edgeware"
else
  PGPASSWORD="${PGPASSWORD}"
fi

DUMP_NAME=latest.dump
if [ "$1" ]; then
  DUMP_NAME=$1
fi

psql -h localhost -d commonwealth -U commonwealth -f "$DUMP_NAME";

if [ "$ETH_ALCHEMY_API_KEY" ]
then
  ETH_ALCHEMY_URL="eth-mainnet.g.alchemy.com/v2"
  psql -h localhost -d commonwealth -U commonwealth -c "UPDATE \"ChainNodes\" SET url = 'https://$ETH_ALCHEMY_URL/$ETH_ALCHEMY_API_KEY', alt_wallet_url = 'https://$ETH_ALCHEMY_URL/$ETH_ALCHEMY_API_KEY' WHERE eth_chain_id = 1;"
else
  echo "You don't have the correct env var set so the Alchemy API urls were not updated"
fi
