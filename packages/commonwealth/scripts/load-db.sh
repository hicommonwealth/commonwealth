# shellcheck disable=SC2046
if [[ $OSTYPE == 'darwin'* ]]; then
  export $(grep -v '^#' ../.env | xargs)
  else
    export $(grep -v '^#' ../.env | xargs -d '\n' -e)
fi

psql -d commonwealth -U commonwealth -W -f latest.dump
psql -d commonwealth -U commonwealth -c "UPDATE \"ChainNodes\" SET url = 'wss://eth-mainnet.g.alchemy.com/v2/pZsX6R3wGdnwhUJHlVmKg4QqsiS32Qm4', alt_wallet_url = 'https://eth-mainnet.g.alchemy.com/v2/pZsX6R3wGdnwhUJHlVmKg4QqsiS32Qm4' WHERE url = 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_' OR url = 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr' OR url = 'wss://eth-mainnet.g.alchemy.com/v2/CAE5iDO8-QLOFwVRZU8PUtYJvqokWfws'"
