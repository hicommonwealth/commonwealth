#!/usr/bin/env bash

# Following steps from: https://github.com/cosmos/cosmos-sdk/tree/v0.46.11/simapp
# set -x
### Setup the environment
CSDK_HOME=$HOME/.simapp
CONFIG_FOLDER=$CSDK_HOME/config
GENESIS=$CONFIG_FOLDER/genesis.json
# You can add this mnemonic to keplr to use the UI
COW_MNEMONIC="ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse scrap clutch cup daughter bench length sell goose deliver critic favorite thought"
TEST_ONE_MNEMONIC="jewel disease neglect feel mother dry hire yellow minute main tray famous"
TEST_TWO_MNEMONIC="wild science ski despair vault sure check car donate slush way window"
CSDK_CHAIN_ID="csdkv1-1"

### start nginx
sed -i "s/listen\ 80;/listen\ ${PORT:=5051};/" /etc/nginx/nginx.conf
echo "starting nginx"
nginx

### intialize the chain
simd init csdk-v1 --chain-id $CSDK_CHAIN_ID
simd config keyring-backend test
simd config chain-id $CSDK_CHAIN_ID
simd config broadcast-mode block
simd config output json
simd config node http://localhost:26657

### Configure chain generated config files - genesis.json, app.toml, config.toml
# Update denom references
dasel put -t string -r json -f $GENESIS -v "ustake" '.app_state.staking.params.bond_denom'
dasel put -t string -r json -f $GENESIS -v "240s" '.app_state.staking.params.unbonding_time'

dasel put -t string -r json -f $GENESIS -v "ustake" '.app_state.txfees.basedenom'
dasel put -t string -r json -f $GENESIS -v "ustake" '.app_state.crisis.constant_fee.denom'
dasel put -t string -r json -f $GENESIS -v "ustake" '.app_state.mint.params.mint_denom'

# Update gov module
dasel put -t string -r json -f $GENESIS -v "180s" '.app_state.gov.voting_params.voting_period'
dasel put -t string -r json -f $GENESIS -v "2000000" '.app_state.gov.deposit_params.min_deposit.[0].amount'
dasel put -t string -r json -f $GENESIS -v "ustake" '.app_state.gov.deposit_params.min_deposit.[0].denom'

# decrease block-time so tests run faster
sed -i "s/timeout_commit = \"5s\"/timeout_commit = \"500ms\"/g" $CONFIG_FOLDER/config.toml
# bind on all interfaces, enabling ports to be exposed outside docker
sed -i "s/127\.0\.0\.1/0.0.0.0/g" $CONFIG_FOLDER/config.toml

# expose the LCD
dasel put -t bool -r toml -f $CONFIG_FOLDER/app.toml -v "true" '.api.enable'
dasel put -t string -r toml -f $CONFIG_FOLDER/app.toml -v "tcp://0.0.0.0:1317" '.api.address'

dasel put -t string -r toml  -f $CONFIG_FOLDER/config.toml -v "tcp://0.0.0.0:26657" '.rpc.laddr'

# Enable cors on RPC
dasel put -t string -r toml -f $CONFIG_FOLDER/config.toml -v "*" '.rpc.cors_allowed_origins.[]'
dasel put -t string -r toml -f $CONFIG_FOLDER/config.toml -v "Accept-Encoding" '.rpc.cors_allowed_headers.[]'
dasel put -t string -r toml -f $CONFIG_FOLDER/config.toml -v "DELETE" '.rpc.cors_allowed_methods.[]'
dasel put -t string -r toml -f $CONFIG_FOLDER/config.toml -v "OPTIONS" '.rpc.cors_allowed_methods.[]'
dasel put -t string -r toml -f $CONFIG_FOLDER/config.toml -v "PATCH" '.rpc.cors_allowed_methods.[]'
dasel put -t string -r toml -f $CONFIG_FOLDER/config.toml -v "PUT" '.rpc.cors_allowed_methods.[]'

# Enable unsafe cors and swagger on the api
dasel put -t bool -r toml -f $CONFIG_FOLDER/app.toml -v "true" '.api.swagger'
dasel put -t bool -r toml -f $CONFIG_FOLDER/app.toml -v "true" '.api.enabled-unsafe-cors'

# Add test accounts with funds
echo "$TEST_ONE_MNEMONIC" | simd keys add test_one --recover --keyring-backend=test --home "$CSDK_HOME"
echo "$TEST_TWO_MNEMONIC" | simd keys add test_two --recover --keyring-backend=test --home "$CSDK_HOME"
simd add-genesis-account test_one 50000000000ustake
simd add-genesis-account test_two 30000000000ustake

echo "$COW_MNEMONIC" | simd keys add cow --recover --keyring-backend=test --home "$CSDK_HOME"

# make cow a validator:
simd add-genesis-account cow 50000000000ustake
simd gentx cow 40000000000ustake --chain-id $CSDK_CHAIN_ID --ip 127.0.0.1
simd collect-gentxs

### Start chain
echo "Starting up csdk v1 node..."
simd start &
CSDK_PID=$!
# Sleep for node to full boot up
sleep 3
# wait again on the node process so it can be terminated with ctrl+C
echo "CSDK v1 node started & state initialized!"
wait $CSDK_PID
