import { Mainnet } from '@edgeware/node-types';
import { IEventHandler, CWEvent, SubstrateEvents, MolochEvents } from '../dist/index';

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
if (SubstrateEvents.Types.EventChains.includes(chain)) {
  // TODO: update this for Beresheet
  SubstrateEvents.createApi(
    url,
    chain.includes('edgeware') ? Mainnet.types : {},
    chain.includes('edgeware') ? Mainnet.typesAlias : {},
  )
  .then(async (api) => {
    const fetcher = new SubstrateEvents.StorageFetcher(api);
    await fetcher.fetch();
    SubstrateEvents.subscribeEvents({
      chain,
      api,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      verbose: true,
    });
  });
} else if (MolochEvents.Types.EventChains.includes(chain)) {
  const contract = contracts[chain];
  const contractVersion = 1;
  if (!contract) throw new Error(`no contract address for chain ${chain}`);
  MolochEvents.createApi(url, contractVersion, contract).then((api) => {
    MolochEvents.subscribeEvents({
      chain,
      api,
      contractVersion,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      verbose: true,
    });
  })
}
