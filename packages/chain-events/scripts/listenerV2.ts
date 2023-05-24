import * as yargs from 'yargs';

import { createListener, LoggingHandler, SupportedNetwork } from '../src';

import { networkUrls, contracts, networkSpecs } from './listenerUtils';
import * as dotenv from 'dotenv';
dotenv.config();

const { argv } = yargs.options({
  network: {
    alias: 'n',
    choices: Object.values(SupportedNetwork),
    demandOption: true,
    description: 'network to listen on',
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
  substrate: {
    chain: 'edgeware',
    network: SupportedNetwork.Substrate,
    url: networkUrls.edgeware,
    spec: networkSpecs.edgeware,
    enricherConfig: {
      balanceTransferThreshold: 500_000,
    },
    chainName: 'Edgeware',
    origin: 'Edgeware',
  },
  erc20: {
    chain: 'erc20',
    network: SupportedNetwork.ERC20,
    url: networkUrls.erc20,
    tokenAddresses: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
    tokenNames: ['usd-coin'],
    chainName: 'Ethereum (Mainnet)',
    origin: 'Ethereum (Mainnet)::ERC20',
  },
  compound: {
    chain: 'marlin',
    network: SupportedNetwork.Compound,
    url: networkUrls.marlin,
    address: contracts.marlin,
    chainName: 'Ethereum (Mainnet)',
    origin: `Ethereum (Mainnet)::${contracts.marlin}`,
  },
  aave: {
    chain: 'dydx',
    network: SupportedNetwork.Aave,
    url: networkUrls.dydx,
    address: contracts.dydx,
    chainName: 'Ethereum (Mainnet)',
    origin: `Ethereum (Mainnet)::${contracts.dydx}`,
  },
  cosmos: {
    chain: 'osmosis',
    network: SupportedNetwork.Cosmos,
    url: networkUrls.osmosis,
    chainName: 'Osmosis',
    origin: 'Osmosis',
  },
};

async function main(): Promise<any> {
  let listener;
  const sc = shortcuts[argv.network];
  try {
    listener = await createListener(sc.origin, sc.chainName, sc.network, {
      url: argv.url || sc.url || networkUrls[sc.chain],
      address: argv.contractAddress || sc.address || contracts[sc.chain],
      tokenAddresses: argv.contractAddress
        ? [argv.contractAddress]
        : sc.tokenAddresses,
      verbose: false,
      enricherConfig: sc.enricherConfig || {
        balanceTransferThreshold: 500_000,
      },
      discoverReconnectRange: argv.reconnectSince
        ? () => Promise.resolve({ startBlock: argv.reconnectSince })
        : undefined,
    });

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
