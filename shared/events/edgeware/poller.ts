/**
 * Fetches historical events from edgeware chain.
 */
import { ApiPromise } from '@polkadot/api';
import { Hash } from '@polkadot/types/interfaces';

import { IBlockPoller, IDisconnectedRange } from '../interfaces';
import { SubstrateBlock } from './types';

export default class extends IBlockPoller<ApiPromise, SubstrateBlock> {
  /**
   * Connects to chain, fetches specified blocks and passes them
   * along for processing.
   *
   * @param startBlock first block to fetch
   * @param endBlock last block to fetch, omit to fetch to latest
   */
  public async poll(range: IDisconnectedRange): Promise<SubstrateBlock[]> {
    // discovery current block if no end block provided
    if (!range.endBlock) {
      const header = await this._api.rpc.chain.getHeader();
      range.endBlock = +header.number;
      console.log(`Discovered endBlock: ${range.endBlock}`);
    }
    if ((range.endBlock - range.startBlock) <= 0) {
      console.error(`End of range (${range.endBlock}) <= start (${range.startBlock})! No blocks to fetch.`);
      return;
    }

    // fetch blocks from start to end
    const blockNumbers = [ ...Array(range.endBlock - range.startBlock).keys()]
      .map((i) => range.startBlock + i);
    console.log(`Fetching hashes for blocks: ${JSON.stringify(blockNumbers)}`);
    const hashes: Hash[] = await this._api.query.system.blockHash.multi(blockNumbers);

    // remove all-0 block hashes -- those blocks have been pruned & we cannot fetch their data
    const nonZeroHashes = hashes.filter((hash) => !hash.isEmpty);
    console.log(`${nonZeroHashes.length} active and ${hashes.length - nonZeroHashes.length} pruned hashes fetched!`);
    console.log('Fetching headers and events...');
    const blocks: SubstrateBlock[] = await Promise.all(nonZeroHashes.map(async (hash) => {
      const header = await this._api.rpc.chain.getHeader(hash);
      const events = await this._api.query.system.events.at(hash);
      console.log(`Poller fetched Block: ${+header.number}`);
      return { header, events };
    }));
    console.log('Finished polling past blocks!');

    return blocks;
  }
}
