# Cosmos Chain Testing Tools

This creates a sandbox Cosmos SDK devnet node, which is a companion to the `http://localhost:8080/csdk` sandbox community. This is running v0.46.11 of Cosmos SDK. This is our first support level for `v1` of the the `gov` module, so it is useful for testing v1 changes.

## Setup 

The easiest way to access the tool is to run `yarn cosmos:build` this will create a docker deployment with two endpoints. The following networking configuration is as follows:
1. RPC - `localhost:5050/rpc`
2. LCD (REST API) - `localhost:5050/lcd/`

## Testing

Once you have a testnet running in docker, you can:
    - test the UI by importing this mnemonic into keplr:
        - 'ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse
          scrap clutch cup daughter bench length sell goose deliver critic favorite thought'
    - run the tests in `packages/commonwealth/test/integration/api/external/proposalTx.spec.ts`

## Live node

See [wiki](https://github.com/hicommonwealth/commonwealth/wiki/Devnet)
-  https://cosmos-devnet.herokuapp.com/rpc
-  https://cosmos-devnet.herokuapp.com/lcd/
    