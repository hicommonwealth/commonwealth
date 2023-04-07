# Cosmos Chain Testing Tools

This creates a sandbox Cosmos SDK devnet node, which is a companion to the `http://localhost:8080/csdk` sandbox community. This is running v0.46.11 of Cosmos SDK. This is our first support level for `v1` of the the `gov` module, so it is useful for testing v1 changes.

## Setup 

The easiest way to access the tool is to run `yarn cosmos:testnet` this will create a docker deployment with two endpoints. The following networking configuration is as follows:
1. RPD - `0.0.0.0:26657`
2. LCD (REST API) - `0.0.0.0:1337`

## Testing

Once you have a testnet running in docker, you can:
    - test the UI by importing this mnemonic into keplr:
        - 'ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse
          scrap clutch cup daughter bench length sell goose deliver critic favorite thought'
    - run the tests in `packages/commonwealth/test/integration/api/external/proposalTx.spec.ts`
    