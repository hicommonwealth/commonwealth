#!/usr/bin/env bash

# Following steps from: https://github.com/cosmos/cosmos-sdk/tree/v0.46.11/simapp
# set -x
### Setup the environment
CSDK_HOME=$HOME/.simapp
CONFIG_FOLDER=$CSDK_HOME/config
GENESIS=$CONFIG_FOLDER/genesis.json
# You can add this mnemonic to keplr to use the UI
COW_MNEMONIC="ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse scrap clutch cup daughter bench length sell goose deliver critic favorite thought"
CSDK_CHAIN_ID="testnet"

### start nginx
sed -i "s/listen\ 80;/listen\ ${PORT:=5050};/" /etc/nginx/nginx.conf
echo "starting nginx"
nginx

### intialize the chain
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

### Configure chain generated config files - genesis.json, app.toml, config.toml
dasel put string -r json  -f $GENESIS -v '600s' '.app_state.gov.voting_params.voting_period'
dasel put string -r json  -f $GENESIS -v '100000' '.app_state.gov.deposit_params.min_deposit.[0].amount'
# expose the LCD
dasel put bool -r toml  -f $CONFIG_FOLDER/app.toml -v "true" '.api.enable'

# Expose the rpc
dasel put string -r toml  -f $CONFIG_FOLDER/config.toml -v "tcp://0.0.0.0:26657" '.rpc.laddr'

# Enable cors on RPC
dasel put string -r toml  -f $CONFIG_FOLDER/config.toml -v "*" '.rpc.cors_allowed_origins.[]'
dasel put string -r toml  -f $CONFIG_FOLDER/config.toml -v "Accept-Encoding" '.rpc.cors_allowed_headers.[]'
dasel put string -r toml  -f $CONFIG_FOLDER/config.toml -v "DELETE" '.rpc.cors_allowed_methods.[]'
dasel put string -r toml  -f $CONFIG_FOLDER/config.toml -v "OPTIONS" '.rpc.cors_allowed_methods.[]'
dasel put string -r toml  -f $CONFIG_FOLDER/config.toml -v "PATCH" '.rpc.cors_allowed_methods.[]'
dasel put string -r toml  -f $CONFIG_FOLDER/config.toml -v "PUT" '.rpc.cors_allowed_methods.[]'

# Enable unsafe cors and swagger on the api
dasel put bool -r toml  -f $CONFIG_FOLDER/app.toml -v "true" '.api.swagger'
dasel put bool -r toml  -f $CONFIG_FOLDER/app.toml -v "true" '.api.enabled-unsafe-cors'

### Start chain
echo "Starting up csdk v1 node..."
simd start --api.enable true &
CSDK_PID=$!
# Sleep for node to full boot up
sleep 3
# wait again on the node process so it can be terminated with ctrl+C
echo "CSDK V1 node started & state initialized!"
wait $CSDK_PID
