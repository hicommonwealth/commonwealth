import type { ApiPromise } from '@polkadot/api';
import type { RegisteredTypes } from '@polkadot/types/types';

import type {
  CWEvent,
  IDisconnectedRange,
  IEventPoller,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { addPrefix, factory } from '../../logging';

import type { Block, EventKind, ISubstrateListenerOptions } from './types';

import type { EnricherConfig } from './index';
import {
  createApi,
  Poller,
  Processor,
  StorageFetcher,
  Subscriber,
} from './index';

// TODO: archival support
export class Listener extends BaseListener<
  ApiPromise,
  StorageFetcher,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: ISubstrateListenerOptions;

  private _poller: IEventPoller<ApiPromise, Block>;

  protected readonly log;

  constructor(
    chain: string,
    url?: string,
    spec?: RegisteredTypes,
    archival?: boolean,
    startBlock?: number,
    skipCatchup?: boolean,
    enricherConfig?: EnricherConfig,
    verbose?: boolean,
    discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>
  ) {
    super(SupportedNetwork.Substrate, chain, verbose);

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Substrate, this._chain])
    );

    this._options = {
      archival: !!archival,
      startBlock: startBlock ?? 0,
      url,
      spec: spec || {},
      skipCatchup: !!skipCatchup,
      enricherConfig: enricherConfig || {},
    };

    this.discoverReconnectRange = discoverReconnectRange;
    this._subscribed = false;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.spec,
        this._chain
      );

      this._api.on('connected', this.processMissedBlocks);
    } catch (error) {
      this.log.error(`Fatal error occurred while starting the API`);
      throw error;
    }

    try {
      this._poller = new Poller(this._api, this._chain);
      this._processor = new Processor(
        this._api,
        this._options.enricherConfig,
        this._chain
      );
      this.storageFetcher = new StorageFetcher(this._api, this._chain);
      this._subscriber = await new Subscriber(
        this._api,
        this._verbose,
        this._chain
      );
    } catch (error) {
      this.log.error(
        `Fatal error occurred while starting the Poller, Processor, Subscriber, and Fetcher`
      );
      throw error;
    }
  }

  public async subscribe(): Promise<void> {
    if (!this._subscriber) {
      this.log.warn(`Subscriber isn't initialized. Please run init() first!`);
      return;
    }

    // processed blocks missed blocks in the background while the subscription is active
    if (!this.options.skipCatchup) {
      await this.processMissedBlocks();
    } else this.log.info(`Skipping event catchup on startup!`);

    try {
      this.log.info(
        `Subscribing to ${this._chain} on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      this.log.error(`Subscription error`, error.message);
      throw error;
    }
  }

  private async processMissedBlocks(): Promise<void> {
    const offlineRange = await this.processOfflineRange(this.log);
    if (!offlineRange) return;

    this.log.info(
      `Missed blocks: ${offlineRange.startBlock} to ${offlineRange.endBlock}`
    );
    try {
      const maxBlocksPerPoll = 100;
      let startBlock = offlineRange.startBlock;
      let endBlock;

      if (startBlock + maxBlocksPerPoll < offlineRange.endBlock)
        endBlock = startBlock + maxBlocksPerPoll;
      else endBlock = offlineRange.endBlock;

      while (endBlock <= offlineRange.endBlock) {
        const blocks = await this.getBlocks(startBlock, endBlock + 1);
        for (const block of blocks) {
          await this.processBlock(block);
        }

        // stop loop when we have fetched all blocks
        if (endBlock === offlineRange.endBlock) break;

        startBlock = endBlock + 1;
        if (endBlock + maxBlocksPerPoll <= offlineRange.endBlock)
          endBlock += maxBlocksPerPoll;
        else endBlock = offlineRange.endBlock;
      }
    } catch (error) {
      this.log.error(
        `Block polling failed after disconnect at block ${offlineRange.startBlock}`,
        error
      );
    }
    this.log.info(
      `Successfully processed block ${offlineRange.startBlock} to ${offlineRange.endBlock}`
    );
  }

  public async getBlocks(
    startBlock: number,
    endBlock?: number
  ): Promise<Block[]> {
    this.log.info(`Polling blocks ${startBlock} to ${endBlock}`);
    return this._poller.poll({ startBlock, endBlock });
  }

  public async updateSpec(spec: RegisteredTypes): Promise<void> {
    // set the new spec
    this._options.spec = spec;

    // restart api with new spec
    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  public async updateUrl(url: string): Promise<void> {
    this._options.url = url;

    // restart api with new url
    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  protected async processBlock(block: Block): Promise<void> {
    // cache block number if needed for disconnection purposes
    const blockNumber = +block.header.number;
    if (
      !this._lastCachedBlockNumber ||
      blockNumber > this._lastCachedBlockNumber
    ) {
      this._lastCachedBlockNumber = blockNumber;
    }

    const events: CWEvent[] = await this._processor.process(block);

    for (const event of events) {
      await this.handleEvent(event as any);
    }
  }

  public get options(): ISubstrateListenerOptions {
    return this._options;
  }

  public async getLatestBlockNumber(): Promise<number> {
    const header = await this._api.rpc.chain.getHeader();
    return +header.number;
  }

  public async isConnected(): Promise<boolean> {
    return this._api.isConnected;
  }
}
