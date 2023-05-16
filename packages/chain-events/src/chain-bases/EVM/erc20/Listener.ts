import type { CWEvent } from '../../../interfaces';
import { SupportedNetwork } from '../../../interfaces';
import { Listener as BaseListener } from '../../../Listener';
import { addPrefix, factory } from '../../../logging';

import type {
  EventKind,
  IErc20Contracts,
  ListenerOptions as Erc20ListenerOptions,
  RawEvent,
} from './types';
import { createApi } from './subscribeFunc';
import { Processor } from './processor';
import { Subscriber } from './subscriber';
import type { EnricherConfig } from './filters/enricher';

export class Listener extends BaseListener<
  IErc20Contracts,
  never,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: Erc20ListenerOptions;

  protected readonly log;

  constructor(
    chain: string,
    tokenAddresses: string[],
    url?: string,
    tokenNames?: string[],
    enricherConfig?: EnricherConfig,
    verbose?: boolean
  ) {
    super(SupportedNetwork.ERC20, chain, verbose);

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.ERC20])
    );

    this._options = {
      url,
      tokenAddresses,
      tokenNames,
      enricherConfig: enricherConfig || {},
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
      this._processor = new Processor(this._api, this._options.enricherConfig);
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
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      this.log.error(`Subscription error: ${error.message}`);
      throw error;
    }
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

  protected async processBlock(
    event: RawEvent,
    tokenName?: string
  ): Promise<void> {
    const cwEvents: CWEvent[] = await this._processor.process(event, tokenName);

    // process events in sequence
    for (const e of cwEvents) {
      await this.handleEvent(e as CWEvent);
    }
  }

  public get options(): Erc20ListenerOptions {
    return this._options;
  }

  public async getLatestBlockNumber(): Promise<number> {
    return this._api.provider.getBlockNumber();
  }

  public async isConnected(): Promise<boolean> {
    // force type to any because the Ethers Provider interface does not include the original
    // Web3 provider, yet it exists under provider.provider
    const provider = <any>this._api.provider;

    // WebSocket ReadyState - more info: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
    const readyState = provider.provider.connection._readyState === 1;
    const socketConnected = provider.provider.connected;
    const polling = provider.polling;

    return readyState && socketConnected && polling;
  }
}
