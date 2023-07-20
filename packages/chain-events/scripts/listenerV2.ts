import * as yargs from 'yargs';

import { createListener, LoggingHandler, SupportedNetwork } from '../src';

import { networkUrls, contracts } from './listenerUtils';
import * as dotenv from 'dotenv';
dotenv.config();

const { argv } = yargs.options({
  network: {
    alias: 'n',
    choices: Object.values(SupportedNetwork),
    demandOption: true,
    description: 'network to listen on',
  },
  chain: {
    alias: 'c',
    type: 'string',
    description: 'name of chain to listen on',
  },
  url: {
    alias: 'u',
    type: 'string',
    description: 'node url',
  },
  contractAddress: {
    alias: 'a',
    type: 'string',
    description: 'eth contract address',
  },
  tokenName: {
    alias: 't',
    type: 'string',
    description:
      'Name of the token if network is erc20 and contractAddress is a erc20 token address',
  },
  reconnectSince: {
    alias: 'R',
    type: 'number',
    description: 'Block number to query from',
  },
});

const shortcuts = {
  erc20: {
    chain: 'erc20',
    network: SupportedNetwork.ERC20,
    url: networkUrls.erc20,
    tokenAddresses: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
    tokenNames: ['usd-coin'],
  },
  compound: {
    chain: 'marlin',
    network: SupportedNetwork.Compound,
    url: networkUrls.marlin,
    address: contracts.marlin,
  },
  aave: {
    chain: 'dydx',
    network: SupportedNetwork.Aave,
    url: networkUrls.dydx,
    address: contracts.dydx,
  },
  cosmos: {
    chain: 'osmosis',
    network: SupportedNetwork.Cosmos,
    url: networkUrls.osmosis,
  },
};

async function main(): Promise<any> {
  let listener;
  let sc;
  if (argv.network && !argv.chain) sc = shortcuts[argv.network];
  try {
    listener = await createListener(
      argv.chain || sc.chain || 'dummyChain',
      argv.network || sc.network,
      {
        url: argv.url || sc.url || networkUrls[argv.chain],
        address: argv.contractAddress || sc.address || contracts[argv.chain],
        tokenAddresses: argv.contractAddress
          ? [argv.contractAddress]
          : sc.tokenAddresses,
        tokenNames: argv.tokenName ? [argv.tokenName] : sc.tokenNames,
        verbose: false,
        enricherConfig: sc.enricherConfig || {
          balanceTransferThreshold: 500_000,
        },
        discoverReconnectRange: argv.reconnectSince
          ? () => Promise.resolve({ startBlock: argv.reconnectSince })
          : undefined,
      }
    );

    listener.eventHandlers.logger = {
      handler: new LoggingHandler(),
      excludedEvents: [],
    };

    await listener.subscribe();
  } catch (e) {
    console.log(e);
  }

  return listener;
}

main().then(() => {
  console.log('Subscribed...');
});
