import { Mainnet, Beresheet, dev } from '@edgeware/node-types';
import { chainSupportedBy, SubstrateEvents, EventSupportingChains, SubstrateTypes } from '../dist/index';

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
};

const url = networks[chain];

if (!url) throw new Error(`no url for chain ${chain}`);
if (chainSupportedBy(chain, SubstrateEvents.Types.EventChains)) {
  // TODO: update this for Beresheet
  const spec = chain === 'edgeware-local' ? dev
    : chain === 'edgeware-testnet' ? Beresheet
      : chain === 'edgeware' ? Mainnet : {};
  SubstrateEvents.createApi(url, spec).then(async (api) => {
    const latestBlock = +(await api.derive.chain.bestNumber());
    const poller = new SubstrateEvents.Poller(api);
    const results = [];
    const CHUNK_SIZE = 1000;
    const END_BLOCK = latestBlock - (latestBlock % CHUNK_SIZE);
    for (let block = CHUNK_SIZE; block <= END_BLOCK; block += CHUNK_SIZE) {
      try {
        const chunk = await poller.poll({ startBlock: block - CHUNK_SIZE, endBlock: block }, CHUNK_SIZE);
        // TODO: do something with chunk
        console.log(`Fetched blocks ${chunk[0].header.number} to ${chunk[CHUNK_SIZE - 1].header.number}.`);
        results.push(...chunk);
      } catch (err) {
        console.error(`Failed to fetch blocks ${block - CHUNK_SIZE}-${block}: ${err.message}.`);
        // TODO: exit if desired
      }
    }
    // TODO: do something with results
    process.exit(0);
  });
}
