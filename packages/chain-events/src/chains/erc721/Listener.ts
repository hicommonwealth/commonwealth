import type { CWEvent } from '../../interfaces';
import { EvmEventSourceMapType, SupportedNetwork } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { addPrefix, factory } from '../../logging';

import type {
  EventKind,
  IErc721Contracts,
  ListenerOptions as Erc721ListenerOptions,
  RawEvent,
} from './types';
import { createApi } from './subscribeFunc';
import { Processor } from './processor';
import { Subscriber } from './subscriber';
import { ethers } from 'ethers';

export class Listener extends BaseListener<
  IErc721Contracts,
  never,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: Erc721ListenerOptions;

  protected readonly log;

  constructor(
    chain: string,
    tokenAddresses: string[],
    url?: string,
    tokenNames?: string[],
    verbose?: boolean
  ) {
    super(SupportedNetwork.ERC721, chain, verbose);

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.ERC721])
    );

    this._options = {
      url,
      tokenAddresses,
      tokenNames,
    };

    this._subscribed = false;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.tokenAddresses,
        this._options.tokenNames,
        10000
      );
    } catch (error) {
      this.log.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._processor = new Processor(this._api);
      this._subscriber = new Subscriber(this._api, this._chain, this._verbose);
    } catch (error) {
      this.log.error(
        'Fatal error occurred while starting the Processor and Subscriber'
      );
      throw error;
    }
  }

  public async subscribe(): Promise<void> {
    if (!this._subscriber) {
      this.log.info("Subscriber isn't initialized. Please run init() first!");
      return;
    }

    try {
      this.log.info(
        `Subscribing to the following token(s): ${
          this.options.tokenNames || '[token names not given!]'
        }, on url ${this._options.url}`
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
    // create an object where the keys are contract addresses and the values are arrays containing all the
    // event signatures from that contract that we want to listen for
    const tokenHashMap: EvmEventSourceMapType = {};
    for (const token of this._api.tokens) {
      tokenHashMap[token.contract.address.toLowerCase()] = {
        eventSignatures: Object.keys(token.contract.interface.events).map((x) =>
          ethers.utils.id(x)
        ),
        api: token.contract.interface,
      };
    }
    return tokenHashMap;
  }

  // override handleEvent to stop the chain from being added to event data
  // since the chain/token name is added to event data in the subscriber.ts
  // (since there are multiple tokens)
  protected async handleEvent(event: CWEvent): Promise<void> {
    let prevResult;

    // eslint-disable-next-line guard-for-in
    for (const key in this.eventHandlers) {
      const eventHandler = this.eventHandlers[key];
      if (
        this.globalExcludedEvents.includes(event.data.kind as EventKind) ||
        eventHandler.excludedEvents?.includes(event.data.kind as EventKind)
      )
        // eslint-disable-next-line no-continue
        continue;

      try {
        prevResult = await eventHandler.handler.handle(event, prevResult);
      } catch (err) {
        this.log.error(`Event handle failure: ${err.message}`);
        break;
      }
    }
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const e of cwEvents) {
      await this.handleEvent(e as CWEvent);
    }

    const { blockNumber } = event;
    if (
      !this._lastCachedBlockNumber ||
      blockNumber > this._lastCachedBlockNumber
    ) {
      this._lastCachedBlockNumber = blockNumber;
    }
  }

  public get options(): Erc721ListenerOptions {
    return this._options;
  }

  public async getLatestBlockNumber(): Promise<number> {
    return this._api.provider.getBlockNumber();
  }

  public async isConnected(): Promise<boolean> {
    // force type to any because the Ethers Provider interface does not include the original
    // Web3 provider, yet it exists under provider.provider
    const provider = <any>this._api.provider;

    return provider.provider ? true : false ;
  }
}
