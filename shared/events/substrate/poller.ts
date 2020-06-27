/**
 * Fetches historical events from substrate chain.
 */
import { ApiPromise } from '@polkadot/api';
import { Hash } from '@polkadot/types/interfaces';

import { IEventPoller, IDisconnectedRange } from '../interfaces';
import { SubstrateBlock } from './types';

import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventPoller<ApiPromise, SubstrateBlock> {
  /**
   * Connects to chain, fetches specified blocks and passes them
   * along for processing.
   *
   * @param startBlock first block to fetch
   * @param endBlock last block to fetch, omit to fetch to latest
   */
  public async poll(range: IDisconnectedRange): Promise<SubstrateBlock[]> {
    // discover current block if no end block provided
    if (!range.endBlock) {
      const header = await this._api.rpc.chain.getHeader();
      range.endBlock = +header.number;
      log.info(`Discovered endBlock: ${range.endBlock}`);
    }
    if ((range.endBlock - range.startBlock) <= 0) {
      log.error(`End of range (${range.endBlock}) <= start (${range.startBlock})! No blocks to fetch.`);
      return;
    }
    if ((range.endBlock - range.startBlock) > 500) {
      log.info(`Attempting to poll ${range.endBlock - range.startBlock} blocks, reducing query size.`);
      range.startBlock = range.endBlock - 500;
    }

    // discover current version
    const version = await this._api.rpc.state.getRuntimeVersion();
    const versionNumber = +version.specVersion;
    const versionName = version.specName.toString();
    // TODO: on newer versions of Substrate, a "system.lastRuntimeUpgrade" query is exposed,
    //   which will tell us if we hit an upgrade during the polling period. But for now, we
    //   can assume that the chain has not been upgraded during the offline polling period
    //   (which for a non-archive node, is only the most recent 250 blocks anyway).

    // fetch blocks from start to end
    const blockNumbers = [ ...Array(range.endBlock - range.startBlock).keys()]
      .map((i) => range.startBlock + i);
    log.debug(`Fetching hashes for blocks: ${JSON.stringify(blockNumbers)}`);
    const hashes: Hash[] = await this._api.query.system.blockHash.multi(blockNumbers);

    // remove all-0 block hashes -- those blocks have been pruned & we cannot fetch their data
    const nonZeroHashes = hashes.filter((hash) => !hash.isEmpty);
    log.info(`${nonZeroHashes.length} active and ${hashes.length - nonZeroHashes.length} pruned hashes fetched!`);
    log.debug('Fetching headers and events...');
    const blocks: SubstrateBlock[] = await Promise.all(nonZeroHashes.map(async (hash) => {
      const header = await this._api.rpc.chain.getHeader(hash);
      const events = await this._api.query.system.events.at(hash);
      const signedBlock = await this._api.rpc.chain.getBlock(hash);
      const extrinsics = signedBlock.block.extrinsics;
      log.trace(`Fetched Block for ${versionName}:${versionNumber}: ${+header.number}`);
      return { header, events, extrinsics, versionNumber, versionName };
    }));
    log.info('Finished polling past blocks!');

    return blocks;
  }
}
