_Authored by Mark Hedelberg 230727._

To develop and test new features for different chains, we use containerized testnet deployments (AKA devnets).

## Cosmos SDK

Note: Currently, the sandbox communities csdk and csdk-beta are on a minimal heroku plan, so they restart intermittently. This means they work fine for manual testing, but created proposals will only persist until the heroku app resets.

### Version 0.46.11 (`gov` module v1)

Live Node Endpoints:
* https://cosmos-devnet.herokuapp.com/rpc
* https://cosmos-devnet.herokuapp.com/lcd/

Deployment:
* https://dashboard.heroku.com/apps/cosmos-devnet

Sandbox community:
* http://localhost:8080/csdk

CI community (ephemeral spin-up for automated tests):

* http://localhost:8080/csdk-v1
* CI tests reference Docker image at https://hub.docker.com/repository/docker/mhagel1/csdk-v1

### Version 0.45.0 (`gov` module v1beta1)

Live Node Endpoints:
* https://cosmos-devnet-beta.herokuapp.com/rpc
* https://cosmos-devnet-beta.herokuapp.com/lcd/

Deployment:
* https://dashboard.heroku.com/apps/cosmos-devnet-beta

Sandbox community:
* http://localhost:8080/csdk-beta

CI community (ephemeral spin-up for automated tests):

* http://localhost:8080/csdk-beta-ci
* CI tests reference Docker image at https://hub.docker.com/repository/docker/mhagel1/csdk-beta

# How to [deploy updates](https://dashboard.heroku.com/apps/cosmos-devnet/deploy/heroku-container):
1. In terminal go to packages/chain-events/cosmos-chain-testing/v1 directory
2. `heroku login`
2. `heroku container:push web` to apply your changes to the heroku app
3. `heroku container:release web` - A new build and deployment will be triggered.

Local Dev CSDK:   
If you ever need to run devnets locally on your machine, there are three helper scripts
```
yarn cosmos:build # build & start first time only
yarn cosmos:start # start - if you have pre-built images
yarn cosmos:stop  # stop container
```
Browse to these
* http://localhost:5050/rpc
* http://localhost:5050/lcd/
* http://localhost:5051/rpc
* http://localhost:5051/lcd/


# How to manually test transactions on the csdk or csdk-beta sandbox community

To create a proposal or vote, you will need an account with staked tokens. We have
a shared address for this purpose.

- In Keplr add a wallet:
    - click avatar in upper right corner
    - Add wallet
    - Import an existing wallet
    - Use recover phrase or private key
    - copy/paste this mnemonic:
`ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse scrap clutch cup daughter bench length sell goose deliver critic favorite thought`
    - Give the wallet a name you can recognize, like "CW devnet"

- Go to http://localhost:8080/csdk-beta or http://localhost:8080/csdk and join community. You should be able to create proposals and vote.
