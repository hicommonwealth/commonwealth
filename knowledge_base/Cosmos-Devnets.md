# Cosmos Devnets

To develop and test new features for Cosmos chains, we use containerized testnet deployments (AKA devnets).

Note: Currently, the sandbox communities csdk, csdk-beta, and evmos-dev are on a minimal heroku plan, so they restart intermittently. This means they work fine for manual testing, but created proposals will only persist until the heroku app resets.

## Contents

- [Deploying Updates to a Sandbox](#deploying-updates-to-a-sandbox)
- [Deploying Updates to a CI Deployment](#deploying-updates-to-a-ci-deployment)
- [Local Development](#local-development)
- [Manually Testing Transactions on the csdk or csdk-beta sandbox community](#manually-testing-transactions-on-the-csdk-or-csdk-beta-sandbox-community)
- [Manually Testing evmos-dev (ethermint sandbox)](#manually-testing-evmos-dev-ethermint-sandbox)
- [Quick Links](#quick-links)
  * [Version 0.46.11 (`gov` module v1)](#version-04611-gov-module-v1)
  * [Version 0.45.0 (`gov` module v1beta1)](#version-0450-gov-module-v1beta1)
  * [Ethermint / Evmos v13.0.2 (`gov` module v1beta1)](#ethermint--evmos-v1302-gov-module-v1beta1)
- [Change Log](#change-log)

## Deploying Updates to a Sandbox

(v1 for example)

See: <https://dashboard.heroku.com/apps/cosmos-devnet/deploy/heroku-container>

1. In terminal go to packages/commonwealth/test/util/cosmos-chain-testing/v1 directory
2. `heroku git:remote -a cosmos-devnet`
3. `heroku login`
4. `heroku container:login`
5. `heroku container:push web` to apply your changes to the heroku app
6. `heroku container:release web` - A new build and deployment will be triggered.

Note: If you get error "No images to push," make sure Dockerfile is capitalized

## Deploying Updates to a CI Deployment

1. Create a remote Docker Hub repo called (for ex) "csdk-v1"
2. In terminal go to packages/commonwealth/test/util/cosmos-chain-testing/v1 directory
3. `docker build -t {your-docker-remote-hub}/csdk-v1 .`
4. `docker push {your-docker-remote-hub}/csdk-v1`
5. If you use a new docker remote, update the reference for tests in CI.yml

## Local Development

If you ever need to run devnets locally on your machine, there are three helper scripts

```bash
yarn cosmos:build # build & start first time only - this takes several minutes

yarn cosmos:start # start container - if you have pre-built images

yarn cosmos:stop  # stop container
```

Browse to these to confirm node is running locally:

* <http://localhost:5050/rpc>
* <http://localhost:5050/lcd/>
* <http://localhost:5051/rpc>
* <http://localhost:5051/lcd/>
* <http://localhost:5052/rpc>
* <http://localhost:5052/lcd/>

## Manually Testing Transactions on the csdk or csdk-beta sandbox community

To create a proposal or vote, you will need an account with staked tokens. We have a shared address for this purpose.

- In Keplr add a wallet:
  - Click the avatar in the upper right corner
  - Add wallet
  - Import an existing wallet
  - Use recover phrase or private key
  - Copy/paste this mnemonic:
        `ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse scrap clutch cup daughter bench length sell goose deliver critic favorite thought`
  - Give the wallet a name you can recognize, like "CW Devnet"

- Go to <http://localhost:8080/csdk-beta> or <http://localhost:8080/csdk> and join community. You should be able to create proposals and vote.

## Manually Testing evmos-dev (ethermint sandbox)

- Add this mnemonic to Keplr:
    `extra cute enough manage arctic acid ball divide reduce turtle pony duck remind short find feature tooth steak fix assault vote sad cattle roof`

- Go to <http://localhost:8080/evmos-dev> and join community. You should be able to create proposals and vote.

- Note: Set gas to zero. There is an issue with displaying tokens correctly, but this address should have tokens. See <https://github.com/hicommonwealth/commonwealth/issues/4909s>

## Quick Links

### Version 0.46.11 (`gov` module v1)

Live Node Endpoints:

* <https://cosmos-devnet.herokuapp.com/rpc>
* <https://cosmos-devnet.herokuapp.com/lcd/>

Deployment:

* <https://dashboard.heroku.com/apps/cosmos-devnet>

Sandbox community:

* <http://localhost:8080/csdk>

CI community (ephemeral spin-up for automated tests):

* <http://localhost:8080/csdk-v1>
* CI tests reference Docker image at <https://hub.docker.com/repository/docker/mhagel1/csdk-v1>

### Version 0.45.0 (`gov` module v1beta1)

Live Node Endpoints:

* <https://cosmos-devnet-beta.herokuapp.com/rpc>
* <https://cosmos-devnet-beta.herokuapp.com/lcd/>

Deployment:

* <https://dashboard.heroku.com/apps/cosmos-devnet-beta>

Sandbox community:

* <http://localhost:8080/csdk-beta>

CI community (ephemeral spin-up for automated tests):

* <http://localhost:8080/csdk-beta-ci>
* CI tests reference Docker image at <https://hub.docker.com/repository/docker/mhagel1/csdk-beta>

### Ethermint / Evmos v13.0.2 (`gov` module v1beta1)

Live Node Endpoints:

* <https://evmos-devnet-81ade29794d4.herokuapp.com/rpc>
* <https://evmos-devnet-81ade29794d4.herokuapp.com/lcd/>

Deployment:

* <https://dashboard.heroku.com/apps/cosmos-devnet-beta>

Sandbox community:

* <http://localhost:8080/evmos-dev>

CI community (ephemeral spin-up for automated tests):

* <http://localhost:8080/evmos-dev-ci>
* CI tests reference Docker image at <https://hub.docker.com/repository/docker/mhagel1/evmos-dev>

## Change Log

- 231211: Updated directory of devnet files.
- 231031: Flagged by Timothee Legros as needing EVM documentation similar to current CSDK info.
- 231031: Flagged by Graham Johnson; `chain-events` package references are obsolete.
- 230727: Updated with Cosmos SDK info by Mark Hagelberg.
- 230418: Authored by Mark Hagelberg.
