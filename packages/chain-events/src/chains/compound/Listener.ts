import type {
  CWEvent,
  EvmEventSourceMapType,
  IDisconnectedRange,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { addPrefix, factory } from '../../logging';

import type {
  Api,
  EventKind,
  IEventData,
  ListenerOptions as CompoundListenerOptions,
  RawEvent,
} from './types';
import { createApi } from './subscribeFunc';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import { Subscriber } from './subscriber';
import { ethers } from 'ethers';

export class Listener extends BaseListener<
  Api,
  StorageFetcher,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: CompoundListenerOptions;

  protected readonly log;

  constructor(
    chain: string,
    contractAddress: string,
    url?: string,
    skipCatchup?: boolean,
    verbose?: boolean,
    discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>
  ) {
    super(SupportedNetwork.Compound, chain, verbose);

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Compound, this._chain])
    );

    this._options = {
      url,
      skipCatchup: !!skipCatchup,
      contractAddress,
    };

    this._subscribed = false;
    this.discoverReconnectRange = discoverReconnectRange;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.contractAddress,
        10 * 1000,
        this._chain
      );
    } catch (error) {
      this.log.error(`Fatal error occurred while starting the API`);
      throw error;
    }

    try {
      this._processor = new Processor(this._api, this._chain);
      this._subscriber = await new Subscriber(
        this._api,
        this._chain,
        this._verbose
      );
    } catch (error) {
      this.log.error(
        `Fatal error occurred while starting the Processor, and Subscriber`
      );
      throw error;
    }

    try {
      this.storageFetcher = new StorageFetcher(this._api, this._chain);
    } catch (error) {
      this.log.error(
        `Fatal error occurred while starting the Ethereum dater and storage fetcher`
      );
      throw error;
    }
  }

  public async subscribe(): Promise<void> {
    if (!this._subscriber) {
      this.log.info(
        `Subscriber for ${this._chain} isn't initialized. Please run init() first!`
      );
      return;
    }

    // processed blocks missed during downtime
    if (!this._options.skipCatchup) await this.processMissedBlocks();
    else this.log.info(`Skipping event catchup on startup!`);

    try {
      this.log.info(
        `Subscribing to Compound contract: ${this._chain}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(
        this.processBlock.bind(this),
        this.getEventSourceMap()
      );
      this._subscribed = true;
    } catch (error) {
      this.log.error(`Subscription error: ${error.message}`);
      throw error;
    }
  }

  private getEventSourceMap(): EvmEventSourceMapType {
    return {
      [this._api.address.toLowerCase()]: {
        eventSignatures: Object.keys(this._api.interface.events).map((x) =>
          ethers.utils.id(x)
        ),
        api: this._api.interface,
      },
    };
  }

  public async updateContractAddress(address: string): Promise<void> {
    if (address === this._options.contractAddress) {
      this.log.warn(`The contract address is already set to ${address}`);
      return;
    }
    this._options.contractAddress = address;

    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const evt of cwEvents)
      await this.handleEvent(evt as CWEvent<IEventData>);

    const { blockNumber } = event;
    if (
      !this._lastCachedBlockNumber ||
      blockNumber > this._lastCachedBlockNumber
    ) {
      this._lastCachedBlockNumber = blockNumber;
    }
  }

  private async processMissedBlocks(): Promise<void> {
    const offlineRange = await this.processOfflineRange(this.log);
    if (!offlineRange) return;

    this.log.info(
      `Missed blocks: ${offlineRange.startBlock} to ${offlineRange.endBlock}`
    );
    try {
      const maxBlocksPerPoll = 250;
      let startBlock = offlineRange.startBlock;
      let endBlock;

      if (startBlock + maxBlocksPerPoll < offlineRange.endBlock)
        endBlock = startBlock + maxBlocksPerPoll;
      else endBlock = offlineRange.endBlock;

      while (endBlock <= offlineRange.endBlock) {
        const cwEvents = await this.storageFetcher.fetch({
          startBlock,
          endBlock,
        });
        for (const event of cwEvents) {
          await this.handleEvent(event);
        }

        // stop loop when we have fetched all blocks
        if (endBlock === offlineRange.endBlock) break;

        startBlock = endBlock + 1;
        if (endBlock + maxBlocksPerPoll <= offlineRange.endBlock)
          endBlock += maxBlocksPerPoll;
        else endBlock = offlineRange.endBlock;
      }
    } catch (error) {
      this.log.error(`Unable to fetch events from storage`, error);
    }
    this.log.info(
      `Successfully processed block ${offlineRange.startBlock} to ${offlineRange.endBlock}`
    );
  }

  public get options(): CompoundListenerOptions {
    return this._options;
  }

  public async getLatestBlockNumber(): Promise<number> {
    return +(await this._api.provider.getBlockNumber());
  }

  public async isConnected(): Promise<boolean> {
    // force type to any because the Ethers Provider interface does not include the original
    // Web3 provider, yet it exists under provider.provider
    const provider = <any>this._api.provider;
    return provider.provider ? true : false;
  }
}
