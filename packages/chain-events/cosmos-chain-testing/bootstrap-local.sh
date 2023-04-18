#!/usr/bin/env bash

# Following steps from: https://github.com/cosmos/cosmos-sdk/tree/v0.46.11/simapp

set -x

CSDK_HOME=$HOME/.simapp
CONFIG_FOLDER=$CSDK_HOME/config
GENESIS=$CONFIG_FOLDER/genesis.json
# You can add this mnemonic to keplr to use the UI
COW_MNEMONIC="ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse scrap clutch cup daughter bench length sell goose deliver critic favorite thought"
CSDK_CHAIN_ID="testnet"


simd init csdk-local --chain-id $CSDK_CHAIN_ID
simd config keyring-backend test
simd config chain-id $CSDK_CHAIN_ID
simd config broadcast-mode block
simd config output json
echo $COW_MNEMONIC | simd keys add cow --recover --keyring-backend=test --home $CSDK_HOME
# make cow a validator:
simd add-genesis-account cow 1000000000000stake
simd gentx cow 7000000000stake --chain-id testnet
simd collect-gentxs
# Update gov module

dasel put -t string -r json  -f $GENESIS -v '600s' '.app_state.gov.voting_params.voting_period'
dasel put -t string -r json  -f $GENESIS -v '100000' '.app_state.gov.deposit_params.min_deposit.[0].amount'
# expose the LCD
dasel put -t bool -r toml  -f $CONFIG_FOLDER/app.toml -v "true" '.api.enable'

# Expose the rpc
dasel put -t string -r toml  -f $CONFIG_FOLDER/config.toml -v "tcp://0.0.0.0:26657" '.rpc.laddr'

# Enable cors on RPC
dasel put -t string -r toml  -f $CONFIG_FOLDER/config.toml -v "*" '.rpc.cors_allowed_origins.[]'
dasel put -t string -r toml  -f $CONFIG_FOLDER/config.toml -v "Accept-Encoding" '.rpc.cors_allowed_headers.[]'
dasel put -t string -r toml  -f $CONFIG_FOLDER/config.toml -v "DELETE" '.rpc.cors_allowed_methods.[]'
dasel put -t string -r toml  -f $CONFIG_FOLDER/config.toml -v "OPTIONS" '.rpc.cors_allowed_methods.[]'
dasel put -t string -r toml  -f $CONFIG_FOLDER/config.toml -v "PATCH" '.rpc.cors_allowed_methods.[]'
dasel put -t string -r toml  -f $CONFIG_FOLDER/config.toml -v "PUT" '.rpc.cors_allowed_methods.[]'

# Enable unsafe cors and swagger on the api
dasel put -t bool -r toml  -f $CONFIG_FOLDER/app.toml -v "true" '.api.swagger'
dasel put -t bool -r toml  -f $CONFIG_FOLDER/app.toml -v "true" '.api.enabled-unsafe-cors'

# check if need to run nginx
if [ "$ENABLE_PROXY" = "1" ]; then
    echo "starting nginx"
    nginx
fi

# Start chain and immediately move it to the background
echo "Starting up csdk node..."
simd start --api.enable true &
CSDK_PID=$!
# Sleep for node to full boot up
sleep 3
# wait again on the regen node process so it can be terminated with ctrl+C
echo "Node started & state inialized!"
wait $CSDK_PID
# echo "starting nginx"
# nginx -g 'daemon off;'