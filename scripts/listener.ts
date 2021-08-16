/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import * as yargs from 'yargs';
import fetch from 'node-fetch';
import type { RegisteredTypes } from '@polkadot/types/types';
import { spec as EdgewareSpec } from '@edgeware/node-types';
import EthDater from 'ethereum-block-by-date';

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
} from '../dist/index';

import { HydraDXSpec } from './specs/hydraDX';
import { KulupuSpec } from './specs/kulupu';
import { StafiSpec } from './specs/stafi';
import { CloverSpec } from './specs/clover';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const networkUrls = {
  clover: 'wss://api.clover.finance',
  hydradx: 'wss://rpc-01.snakenet.hydradx.io',
  edgeware: 'ws://mainnet1.edgewa.re:9944',
  'edgeware-local': 'ws://localhost:9944',
  'edgeware-testnet': 'wss://beresheet1.edgewa.re',
  kusama: 'wss://kusama-rpc.polkadot.io',
  polkadot: 'wss://rpc.polkadot.io',
  kulupu: 'ws://rpc.kulupu.corepaper.org/ws',
  stafi: 'wss://scan-rpc.stafi.io/ws',

  moloch: 'wss://mainnet.infura.io/ws',
  'moloch-local': 'ws://127.0.0.1:9545',

  marlin: 'wss://mainnet.infura.io/ws',
  'marlin-local': 'ws://127.0.0.1:9545',
  uniswap: 'wss://mainnet.infura.io/ws',

  aave: 'wss://mainnet.infura.io/ws',
  'aave-local': 'ws://127.0.0.1:9545',
  'dydx-ropsten': 'wss://ropsten.infura.io/ws',
  dydx: 'wss://mainnet.infura.io/ws',

  erc20: 'wss://mainnet.infura.io/ws',
} as const;
const networkSpecs: { [chain: string]: RegisteredTypes } = {
  clover: CloverSpec,
  hydradx: HydraDXSpec,
  kulupu: KulupuSpec,
  edgeware: EdgewareSpec,
  'edgeware-local': EdgewareSpec,
  'edgeware-testnet': EdgewareSpec,
  stafi: StafiSpec,
};

const contracts = {
  moloch: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
  'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
  marlin: '0x777992c2E4EDF704e49680468a9299C6679e37F6',
  aave: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
  'aave-local': '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9',
  'dydx-ropsten': '0x6938240Ba19cB8a614444156244b658f650c8D5c',
  dydx: '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2',
  uniswap: '0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F',
};

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
  SubstrateEvents.createApi(url, spec).then(async (api) => {
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
      const fetched = await fetcher.fetch(
        undefined, // { startBlock: 0, maxResults: 1 },
        true
      );
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
      const fetched = await fetcher.fetch(
        undefined, // { startBlock: 12300000, maxResults: 1 },
        true
      );
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
    const api = await Erc20Events.createApi(url, tokenAddresses);
    Erc20Events.subscribeEvents({
      chain: network,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
}
