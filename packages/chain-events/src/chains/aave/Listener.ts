import { Listener as BaseListener } from '../../Listener';
import type {CWEvent, EvmEventSourceMapType, IDisconnectedRange} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import type {
  Api,
  EventKind,
  IEventData,
  ListenerOptions as AaveListenerOptions,
  RawEvent,
} from './types';
import { createApi } from './subscribeFunc';
import { Subscriber } from './subscriber';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import {ethers} from "ethers";

export class Listener extends BaseListener<
  Api,
  StorageFetcher,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: AaveListenerOptions;

  protected readonly log;

  constructor(
    chain: string,
    govContractAddress: string,
    url?: string,
    skipCatchup?: boolean,
    verbose?: boolean,
    discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>
  ) {
    super(SupportedNetwork.Aave, chain, verbose);

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Aave, this._chain])
    );

    this._options = {
      url,
      govContractAddress,
      skipCatchup: !!skipCatchup,
    };

    this.discoverReconnectRange = discoverReconnectRange;

    this._subscribed = false;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.govContractAddress,
        10 * 1000,
        this._chain
      );
    } catch (error) {
      this.log.error(`Fatal error occurred while starting the API`);
      throw error;
    }

    try {
      this._processor = new Processor(this._api, this._chain);
      this._subscriber = new Subscriber(this._api, this._chain, this._verbose);
      this.storageFetcher = new StorageFetcher(this._api, this._chain);
    } catch (error) {
      this.log.error(
        `Fatal error occurred while starting the Processor, StorageFetcher and Subscriber`
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

    if (!this.options.skipCatchup) await this.processMissedBlocks();
    else this.log.info(`Skipping event catchup!`);

    try {
      this.log.info(
        `Subscribing to Aave contract: ${this._chain}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this), this.getEventSourceMap());
      this._subscribed = true;
    } catch (error) {
      this.log.error(`Subscription error: ${error.message}`);
      throw error;
    }
  }

  private getEventSourceMap(): EvmEventSourceMapType {
    const gov = this._api.governance;
    const aaveToken = this._api.aaveToken;
    const stkAaveToken = this._api.stkAaveToken;
    return {
      [gov.address]: {
        eventSignatures: Object.keys(gov.interface.events).map(x => ethers.utils.id(x)),
        parseLog: gov.interface.parseLog
      },
      [aaveToken.address]: {
        eventSignatures: Object.keys(aaveToken.interface.events).map(x => ethers.utils.id(x)),
        parseLog: aaveToken.interface.parseLog
      },
      [stkAaveToken.address]: {
        eventSignatures: Object.keys(stkAaveToken.interface.events).map(x => ethers.utils.id(x)),
        parseLog: stkAaveToken.interface.parseLog
      }
    }
  }

  public async updateAddress(): Promise<void> {
    // TODO
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

  protected async processBlock(event: RawEvent): Promise<void> {
    const { blockNumber } = event;
    if (
      !this._lastCachedBlockNumber ||
      blockNumber > this._lastCachedBlockNumber
    ) {
      this._lastCachedBlockNumber = blockNumber;
    }

    const cwEvents: CWEvent[] = await this._processor.process(event);

    for (const evt of cwEvents) {
      await this.handleEvent(evt as CWEvent<IEventData>);
    }
  }

  public get options(): AaveListenerOptions {
    return this._options;
  }

  public async getLatestBlockNumber(): Promise<number> {
    return this._api.governance.provider.getBlockNumber();
  }

  public async isConnected(): Promise<boolean> {
    // force type to any because the Ethers Provider interface does not include the original
    // Web3 provider, yet it exists under provider.provider
    const provider = <any>this._api.governance.provider;

    // WebSocket ReadyState - more info: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
    const readyState = provider.provider.connection._readyState === 1;
    const socketConnected = provider.provider.connected;
    const polling = provider.polling;

    return readyState && socketConnected && polling;
  }
}
