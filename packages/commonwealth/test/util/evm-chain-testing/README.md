# EVM Chain Testing Tools

Check the [Wiki](https://github.com/hicommonwealth/commonwealth/wiki/Chain-Testing-Overview) for up to date info and API docs

The EVM testing tools provide an out of the box environment for testing various EVM funcitonalities. The following tools are provided:

* Fully configured ganache private blockchain
  * Default ETH mainnet fork at latest block
  * unlocked important wallets
  * 12 sec blocktime with automine option
* Chain transaction abstraction API
  * Automatically run set transactions and scripts for onchain activity
  * Self-serve ERC20/ETH actions + Bank
  * Get info and alter the chain(blocks and timestamps)
  * Create governance actions

## Setup

The easiest way to access the tool is to run `docker compose up` this will create a docker deployment with two containers. The following networking configuration is as follows:

1. Ganache Private Chain container - `localhost:8545`
2. Abstraction API container - `localhost:3000`

From here API routes can be used and the private chain can be used as an RPC host anywhere this is used(ie metamask)

To run each service locally the follow this process from the chain-testing dir:

1. Add the host `chain=127.0.0.1` to `/etc/hosts`
2. run `npm run ganache`
3. Specify Host port for API ie `export CHAIN_HOST=3000`
4. Specify that ganache should be used `export RPC_HOST=ganache`
5. run `npm start` in a separate terminal.

## API

The following API routes are available(descriptions coming soon):
Post request types can be found in `src/types.ts`

Chain Info/Interaction\
`GET /chain/accounts`\
`GET /chain/block`\
`POST /chain/advanceTime`\
`POST /chain/getEth`\
Token\
`POST /erc20/balance`\
`POST /erc20/transfer`\
`POST /erc20/approve`\
`POST /erc20/dex/getTokens`\
Governance Routes\
`GET /gov/compound/createProposal`\
`POST /gov/compound/cancelProposal`\
`POST /gov/compound/castVote`\
`POST /gov/compound/castVote`\
`POST /gov/compound/proposalDetails`\
`POST /gov/compound/getVotes`\
`POST /gov/compound/queue`\
`POST /gov/compound/execute`\
`GET /gov/compound/runFullCylce`\
