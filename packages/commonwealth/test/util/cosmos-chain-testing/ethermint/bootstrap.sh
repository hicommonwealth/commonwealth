#!/usr/bin/env bash

### Setup the environment
EVMOS_HOME=$HOME/.evmosd
CONFIG_FOLDER=$EVMOS_HOME/config
GENESIS=$CONFIG_FOLDER/genesis.json
# You can add this mnemonic to keplr to use the UI
COW_MNEMONIC="extra cute enough manage arctic acid ball divide reduce turtle pony duck remind short find feature tooth steak fix assault vote sad cattle roof"
TEST_ONE_MNEMONIC="jewel disease neglect feel mother dry hire yellow minute main tray famous"
TEST_TWO_MNEMONIC="wild science ski despair vault sure check car donate slush way window"
EVMOS_CHAIN_ID="evmos_9000-5"
KEYALGO="eth_secp256k1"
MONIKER="evmos-dev"

### start nginx
sed -i "s/listen\ 80;/listen\ ${PORT:=5052};/" /etc/nginx/nginx.conf
echo "starting nginx"
nginx

## intialize the chain
evmosd init $MONIKER -o --chain-id $EVMOS_CHAIN_ID --home "$EVMOS_HOME"
evmosd config keyring-backend test
evmosd config chain-id $EVMOS_CHAIN_ID --home "$EVMOS_HOME"
evmosd config broadcast-mode block
evmosd config output json
evmosd config node http://localhost:26657

# Change parameter token denominations to aevmos
dasel put -r json -t string -f $GENESIS -v "aevmos" '.app_state.staking.params.bond_denom'
dasel put -r json -t string -f $GENESIS -v "aevmos" '.app_state.crisis.constant_fee.denom'
dasel put -r json -t string -f $GENESIS -v "aevmos" '.app_state.evm.params.evm_denom'
dasel put -r json -t string -f $GENESIS -v "aevmos" '.app_state.inflation.params.mint_denom'
dasel put -t string -r json -f $GENESIS -v "aevmos" '.app_state.txfees.basedenom'
dasel put -t string -r json -f $GENESIS -v "aevmos" '.app_state.mint.params.mint_denom'

# Update gov module
dasel put -r json -t string -f $GENESIS -v "180s" '.app_state.gov.voting_params.voting_period'
# 20 EVMOS deposit:
dasel put -r json -t string -f $GENESIS -v "20000000000000000000" '.app_state.gov.deposit_params.min_deposit.index(0).amount'
dasel put -r json -t string -f $GENESIS -v "aevmos" '.app_state.gov.deposit_params.min_deposit.index(0).denom'

# Set gas limit in genesis
dasel put -r json -t bool -f $GENESIS -v "true" '.app_state.feemarket.params.no_base_fee'
dasel put -r json -t string -f $GENESIS -v "0" '.app_state.feemarket.params.base_fee'
dasel put -r json -t string -f $GENESIS -v "10000000" '.consensus_params.block.max_gas'

# decrease block-time so tests run faster
sed -i "s/timeout_commit = \"5s\"/timeout_commit = \"500ms\"/g" $CONFIG_FOLDER/config.toml
# bind on all interfaces, enabling ports to be exposed outside docker
sed -i "s/127\.0\.0\.1/0.0.0.0/g" $CONFIG_FOLDER/config.toml

# expose the LCD
dasel put -r toml -t bool -f $CONFIG_FOLDER/app.toml -v "true" '.api.enable'
dasel put -t string -r toml -f $CONFIG_FOLDER/app.toml -v "tcp://0.0.0.0:1317" '.api.address'

# Expose the rpc
dasel put -r toml -t string -f $CONFIG_FOLDER/config.toml -v "tcp://0.0.0.0:26657" '.rpc.laddr'

# Enable cors on RPC
dasel put -r toml -t string -f $CONFIG_FOLDER/config.toml -v "*" '.rpc.cors_allowed_origins.[]'
dasel put -r toml -t string -f $CONFIG_FOLDER/config.toml -v "Accept-Encoding" '.rpc.cors_allowed_headers.[]'
dasel put -r toml -t string -f $CONFIG_FOLDER/config.toml -v "DELETE" '.rpc.cors_allowed_methods.[]'
dasel put -r toml -t string -f $CONFIG_FOLDER/config.toml -v "OPTIONS" '.rpc.cors_allowed_methods.[]'
dasel put -r toml -t string -f $CONFIG_FOLDER/config.toml -v "PATCH" '.rpc.cors_allowed_methods.[]'
dasel put -r toml -t string -f $CONFIG_FOLDER/config.toml -v "PUT" '.rpc.cors_allowed_methods.[]'

# Enable unsafe cors and swagger on the api
dasel put -r toml -t bool -f $CONFIG_FOLDER/app.toml -v "true" '.api.swagger'
dasel put -r toml -t bool -f $CONFIG_FOLDER/app.toml -v "true" '.api.enabled-unsafe-cors'

# Enable cors on gRPC Web
dasel put -r toml -t bool -f $CONFIG_FOLDER/app.toml -v "true" '.grpc-web.enable-unsafe-cors'

# Add test accounts with funds
echo "$TEST_ONE_MNEMONIC" | simd keys add test_one --recover --keyring-backend=test --home "$EVMOS_HOME" --algo $KEYALGO
echo "$TEST_TWO_MNEMONIC" | simd keys add test_two --recover --keyring-backend=test --home "$EVMOS_HOME" --algo $KEYALGO
simd add-genesis-account test_one 10000000000000000000000000aevmos
simd add-genesis-account test_two 5000000000000000000000000aevmos

echo $COW_MNEMONIC | evmosd keys add cow --recover --keyring-backend test --home $EVMOS_HOME --algo $KEYALGO
# make cow a validator:
evmosd add-genesis-account "cow" 10000000000000000000000000aevmos --keyring-backend test --chain-id $EVMOS_CHAIN_ID --home "$EVMOS_HOME"
evmosd gentx "cow" 2000000000000000000000000aevmos --keyring-backend test --chain-id $EVMOS_CHAIN_ID --home "$EVMOS_HOME"
evmosd collect-gentxs --chain-id $EVMOS_CHAIN_ID --home "$EVMOS_HOME"
evmosd keys list

sed -i 's/aphoton/aevmos/g' $GENESIS

# Run this to ensure everything worked and that the genesis file is setup correctly
evmosd validate-genesis --home "$EVMOS_HOME"

### Start chain
echo "Starting up evmos node..."
evmosd start --rpc.unsafe --minimum-gas-prices=0.0000aevmos \
--json-rpc.api eth,txpool,personal,net,debug,web3 --api.enable --chain-id $EVMOS_CHAIN_ID \
--keyring-backend test --home "$EVMOS_HOME" & EVMOS_PID=$!

# Sleep for node to full boot up
sleep 3
# wait again on the node process so it can be terminated with ctrl+C
echo "EVMOS-dev node started & state initialized!"
wait $EVMOS_PID
