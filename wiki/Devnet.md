To develop and test new features for different chains, we use containerized testnet deployments (AKA devnets).

## Cosmos SDK

### Version 0.46.11 (`gov` module v1)

Live Node Endpoints:
* https://cosmos-devnet.herokuapp.com/rpc
* https://cosmos-devnet.herokuapp.com/lcd/

Deployment:
* https://dashboard.heroku.com/apps/cosmos-devnet

Sandbox community:
* http://localhost:8080/csdk

### Version 0.45.0 (`gov` module v1beta1)

Live Node Endpoints:
* https://cosmos-devnet-beta.herokuapp.com/rpc
* https://cosmos-devnet-beta.herokuapp.com/lcd/

Deployment:
* https://dashboard.heroku.com/apps/cosmos-devnet-beta

Sandbox community:
* http://localhost:8080/csdk-beta

How to [deploy updates](https://dashboard.heroku.com/apps/cosmos-devnet/deploy/heroku-git):
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