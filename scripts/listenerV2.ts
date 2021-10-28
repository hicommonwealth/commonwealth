import * as yargs from 'yargs';

import { createListener, LoggingHandler, SupportedNetwork } from '../src';

import { networkUrls, contracts, networkSpecs } from './listenerUtils';

require('dotenv').config();

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
});

async function main(): Promise<any> {
  let listener;
  try {
    listener = await createListener(argv.chain || 'dummyChain', argv.network, {
      url: argv.url || networkUrls[argv.chain],
      address: argv.contractAddress || contracts[argv.chain],
      tokenAddresses: [argv.contractAddress],
      tokenNames: [argv.tokenName],
      verbose: false,
      spec: <any>networkSpecs[argv.chain],
      enricherConfig: {
        balanceTransferThreshold: 500_000,
      },
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

main().then((listener) => {
  const temp = listener;
  console.log('Subscribed...');
});
