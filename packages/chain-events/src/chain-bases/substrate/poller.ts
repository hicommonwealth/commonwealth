/**
 * Fetches historical events from substrate chain.
 */
import type { ApiPromise } from '@polkadot/api';

import type { IDisconnectedRange } from '../../interfaces';
import { IEventPoller, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import type { Block } from './types';

export class Poller extends IEventPoller<ApiPromise, Block> {
  protected readonly log;

  constructor(protected _api: ApiPromise, protected readonly origin?: string) {
    super(_api);
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Substrate, origin])
    );
  }

  /**
   * Connects to chain, fetches specified blocks and passes them
   * along for processing.
   *
   * @param range The range of block numbers to poll
   * @param maxRange The maximum number of blocks to poll
   */
  public async poll(
    range: IDisconnectedRange,
    maxRange = 500
  ): Promise<Block[]> {
    // discover current block if no end block provided
    if (!range.endBlock) {
      const header = await this._api.rpc.chain.getHeader();
      range.endBlock = +header.number;
      this.log.info(`Discovered endBlock: ${range.endBlock}`);
    }
    if (range.endBlock - range.startBlock <= 0) {
      this.log.error(
        `End of range (${range.endBlock}) <= start (${range.startBlock})! No blocks to fetch.`
      );
      return [];
    }
    if (range.endBlock - range.startBlock > maxRange) {
      this.log.info(
        `Attempting to poll ${
          range.endBlock - range.startBlock
        } blocks, reducing query size to ${maxRange}.`
      );
      range.startBlock = range.endBlock - maxRange;
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
    const blockNumbers = [
      ...Array(range.endBlock - range.startBlock).keys(),
    ].map((i) => range.startBlock + i);
    this.log.info(
      `Fetching hashes for blocks: ${JSON.stringify(blockNumbers)}`
    );

    // the hashes are pruned when using api.query.system.blockHash.multi
    // therefore fetching hashes from chain. the downside is that for every
    // single hash a separate request is made
    const hashes = await Promise.all(
      blockNumbers.map((number) => this._api.rpc.chain.getBlockHash(number))
    );

    // remove all-0 block hashes -- those blocks have been pruned & we cannot fetch their data
    const nonZeroHashes = hashes.filter((hash) => !hash.isEmpty);
    this.log.info(
      `${nonZeroHashes.length} active and ${
        hashes.length - nonZeroHashes.length
      } pruned hashes fetched!`
    );
    this.log.debug('Fetching headers and events...');
    const blocks: Block[] = await Promise.all(
      nonZeroHashes.map(async (hash) => {
        const header = await this._api.rpc.chain.getHeader(hash);
        const events = await this._api.query.system.events.at(hash);
        const signedBlock = await this._api.rpc.chain.getBlock(hash);
        const { extrinsics } = signedBlock.block;
        this.log.trace(
          `Fetched Block for ${versionName}:${versionNumber}: ${+header.number}`
        );
        return { header, events, extrinsics, versionNumber, versionName };
      })
    );
    this.log.info('Finished polling past blocks!');

    return blocks;
  }

  /**
   * Connects to chain, fetches blocks specified in given range in provided batch size,
   * prcoesses the blocks if a handler is provided
   * @param range IDisconnectedRange having startBlock and optional endBlock
   * @param batchSize size of the batch in which blocks are to be fetched from chain
   * @param processBlockFn an optional function to process the blocks
   */
  public async archive(
    range: IDisconnectedRange,
    batchSize = 500,
    processBlockFn: (block: Block) => void = null
  ): Promise<void> {
    const syncWithHead = !range.endBlock;

    // if the endBlock is not provided then we will run archival mode until we reach the head
    if (syncWithHead) {
      const header = await this._api.rpc.chain.getHeader();
      range.endBlock = +header.number;
    }

    for (
      let block = range.startBlock;
      block < range.endBlock;
      block = Math.min(block + batchSize, range.endBlock)
    ) {
      try {
        const currentBlocks = await this.poll(
          {
            startBlock: block,
            endBlock: Math.min(block + batchSize, range.endBlock),
          },
          batchSize
        );

        // process all blocks sequentially
        if (processBlockFn) {
          for (const b of currentBlocks) {
            await processBlockFn(b);
          }
        }
      } catch (e) {
        this.log.error(
          `Block polling failed after disconnect at block ${range.startBlock}`
        );
        return;
      }
      // if sync with head then update the endBlock to current header
      if (syncWithHead) {
        const header = await this._api.rpc.chain.getHeader();
        range.endBlock = +header.number;
      }
    }
  }
}
