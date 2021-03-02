import * as yargs from 'yargs';

import { spec as EdgewareSpec } from '@edgeware/node-types';
import { HydraDXSpec } from './specs/hydraDX';
import * as CloverSpecTypes from '@clover-network/node-tpye';
import {
  chainSupportedBy, IEventHandler, CWEvent, SubstrateEvents, MarlinEvents, MolochEvents, EventSupportingChains
} from '../dist/index';

const CloverSpec = {
  types: CloverSpecTypes
}

const networkUrls = {
  'clover': 'ws://api.clover.finance',
  'hydradx': 'wss://rpc-01.snakenet.hydradx.io',
  'edgeware': 'ws://mainnet1.edgewa.re:9944',
  'edgeware-local': 'ws://localhost:9944',
  'edgeware-testnet': 'wss://beresheet1.edgewa.re',
  'kusama': 'wss://kusama-rpc.polkadot.io',
  'polkadot': 'wss://rpc.polkadot.io',
  'kulupu': 'ws://rpc.kulupu.corepaper.org/ws',
  'stafi': 'wss://scan-rpc.stafi.io/ws',

  'moloch': 'wss://mainnet.infura.io/ws',
  'moloch-local': 'ws://127.0.0.1:9545',

  'marlin': 'wss://mainnet.infura.io/ws',
  'marlin-local': 'ws://127.0.0.1:9545',
} as const;

const networkSpecs = {
  'clover': CloverSpec,
  'hydradx': HydraDXSpec,
  'edgeware': EdgewareSpec,
  'edgeware-local': EdgewareSpec,
  'edgeware-testnet': EdgewareSpec,
  'stafi': {
    types: {
      ChainId: 'u8',
      DepositNonce: 'u64',
      ResourceId: '[u8; 32]',
    }
  }
}

const contracts = {
  'moloch': '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
  'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
};

const argv = yargs.options({
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
    description: 'when running in archival mode, which block should we start from',
  },

}).check((data) => {
  if (!chainSupportedBy(data.network, SubstrateEvents.Types.EventChains) && data.spec) {
    throw new Error('cannot pass spec on non-substrate network');
  }
  if (!chainSupportedBy(data.network, MolochEvents.Types.EventChains) && data.contractAddress) {
    throw new Error('cannot pass contract address on non-moloch network');
  }
  return true;
}).argv;
const archival: boolean = argv.archival;
// if running in archival mode then which block shall we star from
const startBlock: number = argv.startBlock ?? 0;
const network = argv.network;
const url: string = argv.url || networkUrls[network];
const spec = networkSpecs[network] || {};
const contract: string | undefined = argv.contractAddress || contracts[network];

class StandaloneEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

const skipCatchup = false;

console.log(`Connecting to ${network} on url ${url}...`)
if (chainSupportedBy(network, SubstrateEvents.Types.EventChains)) {
  SubstrateEvents.createApi(url, spec).then(async (api) => {
    const fetcher = new SubstrateEvents.StorageFetcher(api);
    try {
      await fetcher.fetch();
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    SubstrateEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      archival,
      startBlock,
      verbose: true,
    });
  });
} else if (chainSupportedBy(network, MolochEvents.Types.EventChains)) {
  const contractVersion = 1;
  if (!contract) throw new Error(`no contract address for ${network}`);
  MolochEvents.createApi(url, contractVersion, contract).then((api) => {
    MolochEvents.subscribeEvents({
      chain: network,
      api,
      contractVersion,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      verbose: true,
    });
  })
} else if (chainSupportedBy(network, MarlinEvents.Types.EventChains)) {
  const contracts = {
    comp: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f', // TESTNET
    governorAlpha: '0xeDAA76873524f6A203De2Fa792AD97E459Fca6Ff', // TESTNET
    timelock: '0x7d89D52c464051FcCbe35918cf966e2135a17c43'  // TESTNET
  };
  MarlinEvents.createApi(url, contracts).then((api) => {
    MarlinEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      verbose: true,
    })
  })
}
