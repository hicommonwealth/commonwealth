/**
 * Fetches historical events from edgeware chain.
 */
import { ApiPromise } from '@polkadot/api';
import { Hash } from '@polkadot/types/interfaces';

import { IBlockPoller } from '../interfaces';
import { SubstrateBlock } from './types';

export default class extends IBlockPoller<ApiPromise, SubstrateBlock> {
  /**
   * Connects to chain, fetches specified blocks and passes them
   * along for processing.
   *
   * @param startBlock first block to fetch
   * @param endBlock last block to fetch, omit to fetch to latest
   */
  public async poll(startBlock: number, endBlock?: number): Promise<SubstrateBlock[]> {
    // discovery current block if no end block provided
    if (!endBlock) {
      endBlock = (await this._api.derive.chain.bestNumber()).toNumber();
    }
    if ((endBlock - startBlock) >= 0) {
      return;
    }

    // fetch blocks from start to end
    const blockNumbers = [ ...Array(endBlock - startBlock).keys()]
      .map((i) => startBlock + i);
    const blockHashes: Hash[] = await this._api.query.system.header.multi(blockNumbers);

    const blocks: SubstrateBlock[] = await Promise.all(blockHashes.map(async (hash) => {
      const header = await this._api.rpc.chain.getHeader(hash);
      const events = await this._api.query.system.events.at(hash);
      return { header, events };
    }));

    return blocks;
  }
}
