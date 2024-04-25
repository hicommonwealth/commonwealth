# Cosmos Chain Testing Tools

This creates two local Cosmos SDK devnet nodes. `csdk-v1` is running v0.46.11 of Cosmos SDK. `csdk-beta-ci` is running v0.45.0. We can use these to manual test and run the tests for `pnpm run test-devnet`.

## Setup 

The easiest way to access the tool is to run `pnpm run cosmos:build` this will create a docker deployment with two devnets, with two endpoints each. The networking configuration is as follows:

gov v1:
1. RPC - `http://localhost:5050/rpc`
2. LCD (REST API) - `http://localhost:5050/lcd/`

gov v1beta1:
1. RPC - `http://localhost:5051/rpc`
2. LCD (REST API) - `http://localhost:5051/lcd/`

## Testing

Once you have a testnet running in docker, you can:
    - test the UI by importing this mnemonic into keplr:
        - 'ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse
          scrap clutch cup daughter bench length sell goose deliver critic favorite thought'
    - run the tests in `packages/commonwealth/test/devnet/proposalTx.spec.ts` with `pnpm run test-devnet`

## Live nodes

These are sandbox communities for manual testing
See [wiki](https://github.com/hicommonwealth/commonwealth/wiki/Devnet)

gov v1:
-  https://cosmos-devnet.herokuapp.com/rpc
-  https://cosmos-devnet.herokuapp.com/lcd/

gov v1beta1:
-  https://cosmos-devnet-beta.herokuapp.com/rpc
-  https://cosmos-devnet-beta.herokuapp.com/lcd/
