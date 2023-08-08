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
* CI tests reference Docker image at https://hub.docker.com/repository/docker/irowan/heroku-csdk
    * Note: the name `heroku-csdk` was leftover from creating the sandbox community. This image has no association with heroku.

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

# How to [deploy updates](https://dashboard.heroku.com/apps/cosmos-devnet/deploy/heroku-git):
1. In terminal go to packages/chain-events/cosmos-chain-testing/v1 directory
2. `heroku git:remote -a cosmos-devnet` (or `heroku git:remote -a cosmos-devnet-beta` for v1beta1)
    - this creates a heroku git instance for this directory, separate from the regular commonwealth git repo
    - be careful not to confuse these
    - the default branch is `main`. You should be on this branch.
3. Commit any changes you want to make to the dockerfile, bootstrap.sh, etc.
4. To apply your changes to the heroku app, `git push heroku main`
5. A new build and deployment will be triggered.

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