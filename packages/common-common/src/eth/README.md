# Commonwealth Ethereum Configuration

## Compiling Contracts

Build the solidity contracts via typechain using hardhat:

```bash
commonwealth/shared/eth$ npx hardhat compile
```

## Aave Local Development

Spin up a test chain in one terminal:

```bash
commonwealth/shared/eth$ npx hardhat node
```

Deploy the contracts from another terminal:

```bash
commonwealth/shared/eth$ npx hardhat run scripts/deployAave.ts --network localhost
```

Note that this will deploy slightly edited versions of the governance contracts with reduced voting and execution times, to permit easy testing.

To advance blocks and timestamps (default 1 block):

```bash
commonwealth/shared/eth$ ts-node scripts/mineBlocks.ts <nBlocks (default 1)>
```

Mining occurs in a loop, so be careful of the argument size as it could take a long time to process.

Reset your server and load the app:

```bash
commonwealth$ yarn reset-server

commonwealth$ CHAIN_EVENTS=aave,aave-local yarn start
```
