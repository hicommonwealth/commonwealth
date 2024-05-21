# EVM Testing

## Contents

- [EVM Testing Tools](#evm-testing-tools)
- [Setup](#setup)
- [API](#api)
  * [Chain Info/Interaction](#chain-infointeraction)
  * [Token](#token)
  * [Governance Routes](#governance-routes)
- [SDK](#sdk)
  * [Methods](#methods)
- [Private Chain Customization](#private-chain-customization)
  * [Potential Modifications](#potential-modifications)
- [Change Log](#change-log)

- [Change Log](#change-log)

## EVM Testing Tools

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
  * A full-feature SDK to abstract API calls and use types

## Setup

The easiest way to access the tool is to run `docker compose up` this will create a docker deployment with two containers. The following networking configuration is as follows:

1. Ganache Private Chain container - `localhost:8545`
2. Abstraction API container - `localhost:3000`

From here API routes can be used and the private chain can be used as an RPC host anywhere this is used(ie metamask)

To run each service locally the follow this process from the chain-testing dir:

1. run `npm install`
2. Add the host `127.0.0.1       chain` to `/etc/hosts`
3. run `pnpm run ganache`
4. Specify Host port for API ie `export CHAIN_PORT=3000`
5. Specify that ganache should be used `export RPC_HOST=ganache`
6. run `pnpm start` in a separate terminal.

## API

The following API routes are available.

Post request types can be found in `src/types.ts`

### Chain Info/Interaction

<details>
<summary>GET /chain/accounts</summary>

**Response**

```javascript
[
"0x123",
....
]
```

</details>

<details>
<summary>GET /chain/block</summary>

**Response**

See response here <https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#id59>

</details>

<details>
 <summary>POST /chain/advanceTime</summary>

**Request**

```javascript
{
    "seconds": 86400
}
```

**Response**

```javascript
{
    "preTime": (timestamp),
    "postTime": (timestamp)
}
```

</details>

<details>
 <summary>POST /chain/getEth</summary>

**Request**

```javascript
{
    "toAddress": "0x123...",
    "amount": "50"
}
```

</details>

### Token

<details>
 <summary>POST /erc20/balance</summary>

**Request**

```javascript
{
    "tokenAddress": "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    "address": "0x8D9A235C32d37490D7a31190FFDb61341993F310",
    "convert": True // Convert balance from wei
}
```

**Response**

```javascript
{
    "balance": "1000"
}
```

</details>

<details>
 <summary>POST /erc20/transfer</summary>

**Request**

```javascript
{
    "tokenAddress": "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    "to": "0x8D9A235C32d37490D7a31190FFDb61341993F310",
    "amount": "30000", //in ether
    "fromBank": true // get most erc20 tokens from 
}
```

**Response**

200

</details>

<details>
 <summary>POST /erc20/approve</summary

**Request**

```javascript
{
      "tokenAddress": "0x123...",
      "spender": "0x123..."
      "amount": "10000", // in wei
      "accountIndex": 0 // Account to approve from indexed to eth.GetAccounts() endpoint
}
```

**Response**

200

</details>

<details>
 <summary>POST /erc20/dex/getTokens</summary>

**Request**

```javascript
{
    "tokens": ["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"],
    "value": ["1000000000000000000"] // in ether
}
```

**Response**

200

</details>

### Governance Routes

<details>
 <summary>POST /gov/compound/createProposal</summary>

**Request**

```javascript
{
    "accountIndex": 0
}
```

**Response**

```javascript
{
    "proposalId": 123
}
```

</details>

<details>
 <summary>POST /gov/compound/cancelProposal</summary>

**Request**

```javascript
{
    "proposalId": 154
}
```

**Response**

200

</details>

<details>
 <summary>POST /gov/compound/castVote</summary>

**Request**

```javascript
{
    "proposalId": 154,
    "accountIndex": 7,
    "forAgainst": true
}
```

**Response**

200

</details>

<details>
 <summary>POST /gov/compound/proposalDetails</summary>

**Request**

```javascript
{
    "proposalId": 154,
}
```

**Response**

```javascript
{
  "id": 154
  "proposer": [0x2B384212EDc04Ae8bB41738D05BA20E33277bf33]
  "eta": 0
  "startBlock": 16821773
  "endBlock": 16841483
  "forVotes": [92699399205203655279650]
  "againstVotes": 0
  "abstainVotes": 0
  "canceled": false
  "executed": false
}
```

</details>

<details>
 <summary>POST /gov/compound/getVotes</summary>

**Request**

```javascript
{
    "accountIndex": 7,
    "numberOfVotes": "120000"
}
```

**Response**

200

</details>

<details>
 <summary>POST /gov/compound/queue</summary>

**Request**

```javascript
{
    "proposalId": 154
}
```

**Response**

200

</details>

<details>
 <summary>POST /gov/compound/execute</summary>

**Request**

```javascript
{
    "proposalId": 154
}
```

**Response**

200

</details>

<details>
 <summary>GET /gov/compound/runFullCylce</summary>

**Response**

200

</details>

## SDK

The Chain Testing Suite includes an SDK which wraps API calls into methods to be used in typescript code to further abstract use of chain automations. Transactions can be built into any ts project as easy as:

```typescript
import { ChainTesting } from './sdk/chainTesting';

const sdk = new ChainTesting('http://127.0.0.1:8080');

sdk.getErc20(
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // A token Address
    '0xE64309301c49E77Cd73596977ebF0BCA929C406D', // A wallet Address
    '1000' // Amount
  );

sdk.createProposal(0); // Create a Compound proposal
```

### Methods

<details>
<summary>constructor(host: string)
Creates a ChainTesting SDK instance.</summary>

**Arguments**

* `host (string)`: The chain-testing API host.

</details>

<details>
<summary>getBalance(tokenAddress: string, address: string, convert?: boolean)
Get the balance of a given wallet for any ERC20.</summary>

**Arguments**

* `tokenAddress (string)`: The address of ERC20 Token.
* `address (string)`: The address to check balance.
* `convert (boolean, optional)`: Convert from wei to ether? Default is undefined.`

**Returns**
`Promise<string>`: The token balance.

</details>

<details>
<summary>transferErc20(tokenAddress: string, to: string, amount: string, from?: string, accountIndex?: number)
Transfer an ERC20 token between addresses.</summary>

**Arguments**

* `tokenAddress (string)`: ERC20 token address.
* `to (string)`: The address to transfer to.
* `amount (string)`: The amount in ether to transfer.
* `from (string, optional)`: The account to transfer from (erc20.transferFrom).
* `accountIndex (number, optional)`: The account index to create transfer tx from (erc20.transfer).

</details>

<details>
<summary>getErc20(tokenAddress: string, to: string, amount: string)
Gets ERC20 tokens from a 'Bank Wallet'.</summary>

**Arguments**

* `tokenAddress (string)`: ERC20 token address.
* `to (string)`: The address to transfer to.
* `amount (string)`: The amount in ether to receive.

</details>

<details>
<summary>getVotingPower(accountIndex: number, numberOfVotes: string)
Get voting power via ERC20 token for a given wallet.</summary>

**Arguments**

* `accountIndex (number)`: The account index of the test chain to get tokens.
* `numberOfVotes (string)`: The amount of votes/tokens to receive.

</details>

<details>
<summary>createProposal(accountIndex: number)
Creates an arbitrary Compound proposal.</summary>

**Arguments**

* `accountIndex (number)`: The account index.

**Returns**
`Promise<string>`: The proposalId of create Proposal.

</details>

<details>
<summary>cancelProposal(proposalId: string)
Cancel a proposal.</summary>

**Arguments**

* `proposalId (string)`: The proposal Id to cancel.

**Returns**
`Promise<string>`: The proposalId of cancelled.

</details>

<details>
<summary>castVote(proposalId: string, accountIndex: number, forAgainst: boolean)
Cast a vote for an account on a proposal.</summary>

**Arguments**

* `proposalId (string)`: The proposal to vote on.
* `accountIndex (number)`: The account index to vote.
* `forAgainst (boolean)`: Vote for or against.

</details>

<details>
<summary>queueProposal(proposalId: string)
Queue a proposal for execution.</summary>

**Arguments**

* `proposalId (string)`: The proposalId.

</details>

<details>
<summary>executeProposal(proposalId: string)
Execute a passed proposal.</summary>

**Arguments**

* `proposalId (string)`: The proposalId.

</details>

`runProposalCycle()`
Runs a full proposal cycle from getting voting power to execution.

<details>
<summary>getProposalDetails(proposalId: string)
Gets proposal Details from contract</summary>

**Arguments**

* `proposalId (string)`: The proposalId

**Response**

JSON formatted proposal Details

</details>

<details>
<summary>getBlock()Gets the latest block details</summary>
</details>

<details>
<summary>getETH(toAddress: string, amount: string)Get ETH to a given account</summary>

**Arguments**

* `toAddress (string)`: The address to send ETH to
* `amount (string)`: The amount of eth in ether to receive

</details>

<details>
<summary>getProvider()Gets a web3 provider instance for the running test chain</summary>
Returns an instance of a web3.js provider for the current test chain(HTTP)
</details>

## Private Chain Customization

Features of the private chain can be adjusted to work for different use cases.

A set of deployment params as follows can be found in both `package.json` and `docker-compose.yml`\
`--fork --miner.blockTime 12 --wallet.unlockedAccounts 0xF977814e90dA44bFA03b6295A0616a897441aceC --wallet.unlockedAccounts 0xfA9b5f7fDc8AB34AAf3099889475d47febF830D7`
Here the following params can be defined as

* fork - Fork the ETH mainnet(uses built in infura endpoint) at latest block
* miner.blockTime - the time between mining each block
* wallet.unlockedAccounts - This unlocks the following address for use in the 'from' field of an eth tx. ie allows user to access this wallet.

### Potential Modifications

1. fork from a block or other evm network
   * Any ETH block can be selected as the starting block via `--fork [blockNumber]`
   * Any network can be forked by providing the RPC provider `--fork rpc.somePolygonRPC.com@[blockNumber]`
2. Changing block time or insta-mining
   * The block time behind updated by modifying the value after `miner.blockTime`
   * Removing `miner.blockTime` will switch to insta-mining(good for contract unit tests)
3. Modify available wallets/accounts
   * set a value for `--wallet.totalAccounts` to include more generated accounts(defaults to 10)
   * set a value for `--wallet.defaultBalance` to set the amount of ether to start each account with(defaults to 1000)
   * Add an unlocked wallet via an additional `--wallet.unlockAccounts`. This is helpful for emulating actions of other users/wallets etc

## Change Log

- 230515: Updated with Service Testing section by Timothee Legros.
- 230218: Authored by Timothee Legros
