import { Mainnet, Beresheet, dev } from '@edgeware/node-types';
import { LogGroupControlSettings } from 'typescript-logging';
import { chainSupportedBy, SubstrateEvents, EventSupportingChains, SubstrateTypes } from '../dist/index';
import { factoryControl } from '../dist/logging';

factoryControl.change({ group: 'all', logLevel: 'Info' } as LogGroupControlSettings);

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

    // iterate over all blocks in chunks, from smallest to largest, and place in result array
    for (let block = CHUNK_SIZE; block <= latestBlock; block += CHUNK_SIZE) {
      try {
        const chunk = await poller.poll({
          startBlock: block - CHUNK_SIZE,
          endBlock: Math.min(block, latestBlock)
        }, CHUNK_SIZE);
        // TODO: do something with chunk array

        // the final query will be smaller than CHUNK_SIZE, otherwise a shortened length means pruning took place
        if (chunk.length < CHUNK_SIZE && block < latestBlock) {
          throw new Error('Found pruned headers, must query archival node');
        }
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
