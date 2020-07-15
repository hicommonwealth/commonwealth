import { IEventHandler, CWEvent } from '../src/interfaces';

import subscribeMolochEvents, { createMolochApi } from '../src/moloch/index';
import { MolochEventChains } from '../src/moloch/types';

import subscribeSubstrateEvents, { createSubstrateApi, createSubstrateProvider } from '../src/substrate/index';
import { SubstrateEventChains } from '../src/substrate/types';
import storageFetcher from '../src/substrate/storageFetcher';

import { factory, formatFilename } from '../src/logging';
const log = factory.getLogger(formatFilename(__filename));

const args = process.argv.slice(2);
const chain = args[0] || 'edgeware';
log.info(`Listening to events on ${chain}.`);

const networks = {
  'edgeware': 'ws://mainnet1.edgewa.re:9944',
  'edgeware-local': 'ws://localhost:9944',
  'kusama': 'wss://kusama-rpc.polkadot.io',
  'polkadot': 'wss://rpc.polkadot.io',

  'moloch': 'wss://mainnet.infura.io/ws',
  'moloch-local': 'ws://127.0.0.1:9545',
};

const contracts = {
  'moloch': '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
  'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
};

class StandaloneEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    log.info(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

const skipCatchup = false;

const url = networks[chain];
if (!url) throw new Error(`no url for chain ${chain}`);
if (SubstrateEventChains.includes(chain)) {
  createSubstrateProvider(url).then((provider) => {
    return createSubstrateApi(provider, chain).isReady;
  }).then((api) => {
    const fetcher = new storageFetcher(api);
    return fetcher.fetch().then(() => api);
  }).then((api) => {
    subscribeSubstrateEvents({
      chain,
      api,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      verbose: true,
    });
  });
} else if (MolochEventChains.includes(chain)) {
  const contract = contracts[chain];
  const contractVersion = 1;
  if (!contract) throw new Error(`no contract address for chain ${chain}`);
  createMolochApi(url, contractVersion, contract).then((api) => {
    subscribeMolochEvents({
      chain,
      api,
      contractVersion,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      verbose: true,
    });
  })
}
