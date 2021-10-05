/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import {
  chainSupportedBy,
  IEventHandler,
  CWEvent,
  SubstrateEvents,
  CompoundEvents,
  MolochEvents,
  EventSupportingChains,
  AaveEvents,
  Erc20Events,
} from '../src/index';

import { contracts, networkSpecs, networkUrls } from './listenerUtils';

import * as yargs from 'yargs';
import fetch from 'node-fetch';
import EthDater from 'ethereum-block-by-date';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const { argv } = yargs
  .options({
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
    archival: {
      alias: 'a',
      type: 'boolean',
      description: 'run listener in archival mode or not',
    },
    startBlock: {
      alias: 'b',
      type: 'number',
      description:
        'when running in archival mode, which block should we start from',
    },
  })
  .check((data) => {
    if (
      !chainSupportedBy(data.network, SubstrateEvents.Types.EventChains) &&
      data.spec
    ) {
      throw new Error('cannot pass spec on non-substrate network');
    }
    if (
      !chainSupportedBy(data.network, MolochEvents.Types.EventChains) &&
      data.contractAddress
    ) {
      throw new Error('cannot pass contract address on non-moloch network');
    }
    return true;
  });

const { archival } = argv;
// if running in archival mode then which block shall we star from
const startBlock: number = argv.startBlock ?? 0;
const { network } = argv;
const url: string = argv.url || networkUrls[network];
const spec = networkSpecs[network] || {};
const contract: string | undefined = argv.contractAddress || contracts[network];
class StandaloneEventHandler extends IEventHandler {
  // eslint-disable-next-line class-methods-use-this
  public async handle(event: CWEvent): Promise<null> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
    return null;
  }
}
const skipCatchup = false;
const tokenListUrls = [
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link',
  'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link',
];

async function getTokenLists() {
  const data = await Promise.all(
    tokenListUrls.map((listUrl) =>
      fetch(listUrl)
        .then((o) => o.json())
        .catch((e) => {
          console.error(e);
          return [];
        })
    )
  );
  return data
    .map((o) => o && o.tokens)
    .flat()
    .filter((o) => o);
}
console.log(`Connecting to ${network} on url ${url}...`);
if (chainSupportedBy(network, SubstrateEvents.Types.EventChains)) {
  SubstrateEvents.createApi(url, spec as any).then(async (api) => {
    const fetcher = new SubstrateEvents.StorageFetcher(api);
    try {
      const fetched = await fetcher.fetch();
      console.log(fetched.map((f) => f.data));
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    SubstrateEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      archival,
      startBlock,
      verbose: true,
      enricherConfig: { balanceTransferThresholdPermill: 1_000 }, // 0.1% of total issuance
    });
  });
} else if (chainSupportedBy(network, MolochEvents.Types.EventChains)) {
  const contractVersion = 1;
  if (!contract) throw new Error(`no contract address for ${network}`);
  MolochEvents.createApi(url, contractVersion, contract).then(async (api) => {
    const dater = new EthDater(api.provider);
    const fetcher = new MolochEvents.StorageFetcher(
      api,
      contractVersion,
      dater
    );
    try {
      const fetched = await fetcher.fetch(
        { startBlock: 11000000, maxResults: 3 },
        true
      );
      // const fetched = await fetcher.fetchOne('132');
      console.log(fetched.map((f) => f.data));
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    MolochEvents.subscribeEvents({
      chain: network,
      api,
      contractVersion,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
} else if (chainSupportedBy(network, CompoundEvents.Types.EventChains)) {
  if (!contract) throw new Error(`no contract address for ${network}`);
  CompoundEvents.createApi(url, contract).then(async (api) => {
    const fetcher = new CompoundEvents.StorageFetcher(api);
    try {
      const fetched = await fetcher.fetch({
        startBlock: 13353227,
        maxResults: 1,
      });
      // const fetched = await fetcher.fetchOne('2');
      console.log(fetched.map((f) => f.data));
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    CompoundEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
} else if (chainSupportedBy(network, AaveEvents.Types.EventChains)) {
  if (!contract) throw new Error(`no contract address for ${network}`);
  AaveEvents.createApi(url, contract).then(async (api) => {
    const fetcher = new AaveEvents.StorageFetcher(api);
    try {
      const fetched = await fetcher.fetch({
        startBlock: 13353227,
        maxResults: 1,
      });
      // const fetched = await fetcher.fetchOne('10');
      console.log(fetched.sort((a, b) => a.blockNumber - b.blockNumber));
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    AaveEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
} else if (chainSupportedBy(network, Erc20Events.Types.EventChains)) {
  getTokenLists().then(async (tokens) => {
    const tokenAddresses = tokens.map((o) => o.address);
    const tokenNames = tokens.map((o) => o.name);
    const api = await Erc20Events.createApi(url, tokenAddresses, tokenNames);
    Erc20Events.subscribeEvents({
      chain: network,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: false,
      enricherConfig: { balanceTransferThresholdPermill: 500_000 }, // 50% of total supply
    });
  });
}
