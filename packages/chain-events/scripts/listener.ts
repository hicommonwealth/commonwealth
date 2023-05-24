/* eslint-disable no-console */

import * as yargs from 'yargs';
import fetch from 'node-fetch';
import EthDater from 'ethereum-block-by-date';

import type { CWEvent } from '../src/index';
import {
  IEventHandler,
  SubstrateEvents,
  CompoundEvents,
  AaveEvents,
  Erc20Events,
  SupportedNetwork,
  Erc721Events,
  CosmosEvents,
} from '../src/index';

import { contracts, networkSpecs, networkUrls } from './listenerUtils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const { argv } = yargs
  .options({
    network: {
      alias: 'n',
      choices: Object.values(SupportedNetwork),
      demandOption: true,
      description: 'network listener to use',
    },
    chain: {
      alias: 'c',
      type: 'string',
      description: 'chain to listen on',
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
    archival: {
      alias: 'A',
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
    if (!data.url && !data.chain) {
      if (data.network === SupportedNetwork.Substrate) {
        throw new Error('Must pass either URL or chain name!');
      } else {
        // default to eth mainnet if not on substrate
        data.chain = 'erc20';
      }
    }
    if (!networkUrls[data.chain] && !data.url) {
      throw new Error(`no URL found for ${data.chain}`);
    }
    if (
      data.network !== SupportedNetwork.Substrate &&
      data.network !== SupportedNetwork.ERC20 &&
      data.network !== SupportedNetwork.ERC721 &&
      data.network !== SupportedNetwork.Cosmos &&
      !data.contractAddress &&
      !contracts[data.chain]
    ) {
      throw new Error(`no contract found for ${data.chain}`);
    }
    if (
      data.network === SupportedNetwork.Substrate &&
      !networkSpecs[data.chain]
    ) {
      throw new Error(`no spec found for ${data.chain}`);
    }
    return true;
  });

const { archival } = argv;
// if running in archival mode then which block shall we star from
const startBlock: number = argv.startBlock ?? 0;
const { network } = argv;
const chain = argv.chain || 'dummy';
const url = argv.url || networkUrls[chain];
const spec = networkSpecs[chain];
const contract = argv.contractAddress || contracts[chain];

class StandaloneEventHandler extends IEventHandler {
  // eslint-disable-next-line class-methods-use-this
  public async handle(event: CWEvent): Promise<null> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
    return null;
  }
}
const skipCatchup = false;
const tokenListUrls = ['https://gateway.ipfs.io/ipns/tokens.uniswap.org'];
const nftListUrls = [
  'https://raw.githubusercontent.com/jnaviask/collectible-lists/main/test/schema/bigexample.collectiblelist.json',
];

interface TokenListEntry {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  standard?: string; // erc721
  decimals?: number; // 18
}

async function getTokenList(tokenListUrl: string): Promise<TokenListEntry[]> {
  const data = await fetch(tokenListUrl)
    .then((o) => o.json())
    .catch((e) => {
      console.error(e);
      return [];
    });
  return data?.tokens?.filter((o) => o);
}

console.log(`Connecting to ${chain} on url ${url}...`);

if (network === SupportedNetwork.Compound) {
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
      chain,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
} else if (network === SupportedNetwork.Aave) {
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
      chain,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
} else if (network === SupportedNetwork.ERC20) {
  getTokenList(tokenListUrls[0]).then(async (tokens) => {
    const validTokens = tokens.filter((t) => t.chainId === 1);
    const tokenAddresses = validTokens.map((o) => o.address);
    const tokenNames = validTokens.map((o) => o.name);
    const api = await Erc20Events.createApi(url, tokenAddresses, tokenNames);
    Erc20Events.subscribeEvents({
      chain,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: false,
      enricherConfig: { balanceTransferThresholdPermill: 500_000 }, // 50% of total supply
    });
  });
} else if (network === SupportedNetwork.ERC721) {
  getTokenList(nftListUrls[0]).then(async (tokens) => {
    const validTokens = tokens.filter(
      (t) => t.chainId === 1 && t.standard === 'erc721'
    );
    const tokenAddresses = validTokens.map((o) => o.address);
    const tokenNames = validTokens.map((o) => o.name);
    const api = await Erc721Events.createApi(url, tokenAddresses, tokenNames);
    Erc721Events.subscribeEvents({
      chain,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: false,
    });
  });
} else if (network === SupportedNetwork.Cosmos) {
  CosmosEvents.createApi(url).then(async (api) => {
    new CosmosEvents.StorageFetcher(api);
    try {
      // const fetched = await fetcher.fetch();
      // console.log(fetched.sort((a, b) => a.blockNumber - b.blockNumber));
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    CosmosEvents.subscribeEvents({
      chain,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
}
