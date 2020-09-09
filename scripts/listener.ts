import { Mainnet, Beresheet, dev } from '@edgeware/node-types';
import {
  chainSupportedBy, IEventHandler, CWEvent, SubstrateEvents, MolochEvents, EventSupportingChains
} from '../dist/index';

const args = process.argv.slice(2);
const chain = args[0] || 'edgeware';
if (!chainSupportedBy(chain, EventSupportingChains)) {
  throw new Error(`invalid chain: ${args[0]}`);
}
console.log(`Listening to events on ${chain}.`);

const networks = {
  'edgeware': 'ws://mainnet1.edgewa.re:9944',
  'edgeware-local': 'ws://localhost:9944',
  'edgeware-testnet': 'wss://beresheet1.edgewa.re',
  'kusama': 'wss://kusama-rpc.polkadot.io',
  'polkadot': 'wss://rpc.polkadot.io',
  'kulupu': 'ws://rpc.kulupu.corepaper.org/ws',

  'moloch': 'wss://mainnet.infura.io/ws',
  'moloch-local': 'ws://127.0.0.1:9545',
};

const contracts = {
  'moloch': '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
  'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
};

class StandaloneEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

const skipCatchup = false;

const url = networks[chain];

if (!url) throw new Error(`no url for chain ${chain}`);
if (chainSupportedBy(chain, SubstrateEvents.Types.EventChains)) {
  // TODO: update this for Beresheet
  SubstrateEvents.createApi(
    url,
    chain === 'edgeware-local'
      ? dev.types
      : chain === 'edgeware-testnet'
        ? Beresheet.types
        : chain === 'edgeware' ? Mainnet.types : {},
    chain === 'edgeware-local'
        ? dev.typesAlias
        : chain === 'edgeware-testnet'
          ? Beresheet.typesAlias
          : chain === 'edgeware' ? Mainnet.typesAlias : {},
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
} else if (chainSupportedBy(chain, SubstrateEvents.Types.EventChains)) {
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
