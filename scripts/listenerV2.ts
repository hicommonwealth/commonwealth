import * as yargs from 'yargs';

import { createListener, EventSupportingChains, LoggingHandler } from '../src';

const { argv } = yargs.options({
  network: {
    alias: 'n',
    choices: EventSupportingChains,
    demandOption: true,
    description: 'chain to listen on',
  },
  url: {
    alias: 'u',
    type: 'string',
    description: 'node url',
  },
  contractAddress: {
    alias: 'c',
    type: 'string',
    description: 'eth contract address',
  },
  tokenName: {
    alias: 'a',
    type: 'string',
    description:
      'Name of the token if network is erc20 and contractAddress is a erc20 token address',
  },
});

async function main(): Promise<any> {
  let listener;
  try {
    listener = await createListener(argv.network, {
      url: argv.url,
      address: argv.contractAddress,
      tokenAddresses: [argv.contractAddress],
      tokenNames: [argv.tokenName],
      verbose: false,
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
