import { Listener as BaseListener } from '../../Listener';
import type {
  CWEvent,
  EvmEventSourceMapType,
  IDisconnectedRange,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import {ListenerOptions, RawEvent} from '../EVM/types';
import { createApi as createAaveApi } from '../aave/subscribeFunc';
import { createApi as createCompoundApi } from '../compound/subscribeFunc';
import { Subscriber } from '../EVM/subscriber';
import { Processor } from '../EVM/processor';
import { ethers } from 'ethers';
import { getRawEvents, pascalToKebabCase } from 'chain-events/src/eth';
import { Enrich as AaveEnricher } from '../aave/filters/enricher';
import { Enrich as CompoundEnricher } from '../compound/filters/enricher';
import { JsonRpcProvider } from '@ethersproject/providers';

export class Listener extends BaseListener<
  any,
  any,
  any,
  any,
  any
> {
  private readonly _options: ListenerOptions;

  protected readonly log;

  protected readonly listenerBase: 'aave' | 'compound';

  constructor(
    chain: string,
    contractAddress: string,
    url: string,
    // TODO: @Timothee - temporary until ABI based CE PR
    listenerBase: 'aave' | 'compound',
    skipCatchup?: boolean,
    verbose?: boolean,
    discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>
  ) {
    if (listenerBase === 'aave') {
      super(SupportedNetwork.Aave, chain, verbose);
      this.log = factory.getLogger(
        addPrefix(__filename, [SupportedNetwork.Aave, this._chain])
      );
    }
    else {
      super(SupportedNetwork.Compound, chain, verbose);
      this.log = factory.getLogger(
        addPrefix(__filename, [SupportedNetwork.Compound, this._chain])
      );
    }

    this._options = {
      url,
      contractAddress,
      skipCatchup: !!skipCatchup,
    };

    this.discoverReconnectRange = discoverReconnectRange;

    this._subscribed = false;
    this.listenerBase = listenerBase;
  }

  public async init(): Promise<void> {
    try {
      if (this.listenerBase === 'aave') {
        this._api = await createAaveApi(
          this._options.url,
          this._options.contractAddress,
          10 * 1000,
          this._chain
        );
      } else {
        this._api = await createCompoundApi(
          this._options.url,
          this._options.contractAddress,
          10 * 1000,
          this._chain
        )
      }
    } catch (error) {
      this.log.error(`Fatal error occurred while starting the API`);
      throw error;
    }

    try {
      if (this.listenerBase === 'aave') this._processor = new Processor(AaveEnricher);
      else this._processor = new Processor(CompoundEnricher);

      this._subscriber = new Subscriber(
        this.getProvider(),
        this._chain,
        this.getContractAddresses(),
        this._verbose
      );
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
    if (this.listenerBase === 'aave') {
      const gov = this._api.governance;
      const aaveToken = this._api.aaveToken;
      const stkAaveToken = this._api.stkAaveToken;
      return {
        [gov.address.toLowerCase()]: {
          eventSignatures: Object.keys(gov.interface.events).map((x) =>
            ethers.utils.id(x)
          ),
          api: gov.interface,
        },
        [aaveToken.address.toLowerCase()]: {
          eventSignatures: Object.keys(aaveToken.interface.events).map((x) =>
            ethers.utils.id(x)
          ),
          api: aaveToken.interface,
        },
        [stkAaveToken.address.toLowerCase()]: {
          eventSignatures: Object.keys(stkAaveToken.interface.events).map((x) =>
            ethers.utils.id(x)
          ),
          api: stkAaveToken.interface,
        },
      };
    } else {
      return {
        [this._api.address.toLowerCase()]: {
          eventSignatures: Object.keys(this._api.interface.events).map((x) =>
            ethers.utils.id(x)
          ),
          api: this._api.interface,
        },
      };
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
        const cwEvents = await this.fetchEvents({
          start: startBlock,
          end: endBlock,
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
    const cwEvents: CWEvent[] = await this._processor.process(event);

    for (const evt of cwEvents) {
      // TODO: @Timothee - remove <any> in ABI PR
      await this.handleEvent(evt as CWEvent<any>);
    }

    const { blockNumber } = event;
    if (
      !this._lastCachedBlockNumber ||
      blockNumber > this._lastCachedBlockNumber
    ) {
      this._lastCachedBlockNumber = blockNumber;
    }
  }

  public get options(): ListenerOptions {
    return this._options;
  }

  public async getLatestBlockNumber(): Promise<number> {
    return this.getProvider().getBlockNumber();
  }

  public async isConnected(): Promise<boolean> {
    // force type to any because the Ethers Provider interface does not include the original
    // Web3 provider, yet it exists under provider.provider
    return this.getProvider().provider ? true : false;
  }

  public async fetchEvents(blockRange: {
    start: number | string;
    end: number | string;
  }) {
    const rawEvents = await getRawEvents(
      <JsonRpcProvider>this.getProvider(),
      this.getEventSourceMap(),
      blockRange
    );
    const enrichedEvents = [];
    for (const event of rawEvents) {
      // TODO: This basically the same as the processor functionality
      const kind = pascalToKebabCase(event.name);
      if (!kind) continue;
      try {
        let cwEvent;
        if (this.listenerBase === 'aave') cwEvent = await AaveEnricher(event.blockNumber, kind, event);
        else cwEvent = await CompoundEnricher(event.blockNumber, kind, event);
        enrichedEvents.push(cwEvent);
      } catch (e) {
        this.log.error(
          `Failed to enrich event. Block number: ${event.blockNumber}, Name/Kind: ${event.name}, Error Message: ${e.message}`
        );
      }
    }

    return enrichedEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber);
  }

  public getProvider() {
    if (this.listenerBase === 'aave') {
      return this._api.governance.provider;
    } else {
      return this._api.provider;
    }
  }

  public getContractAddresses(): string[] {
    if (this.listenerBase === 'aave') {
      return [
        this._api.governance.address,
        this._api.aaveToken.address,
        this._api.stkAaveToken.address,
      ]
    } else {
      return [
        this._api.address
      ]
    }
  }
}
