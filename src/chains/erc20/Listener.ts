import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
} from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { factory, formatFilename } from '../../logging';

import {
  ListenerOptions as Erc20ListenerOptions,
  RawEvent,
  EventChains as erc20Chains,
  IErc20Contracts,
  EventKind,
} from './types';
import { createApi } from './subscribeFunc';
import { Processor } from './processor';
import { Subscriber } from './subscriber';
import { EnricherConfig } from './filters/enricher';

const log = factory.getLogger(formatFilename(__filename));

export class Listener extends BaseListener<
  IErc20Contracts,
  never,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: Erc20ListenerOptions;

  constructor(
    chain: EventSupportingChainT,
    tokenAddresses: string[],
    url?: string,
    tokenNames?: string[],
    enricherConfig?: EnricherConfig,
    verbose?: boolean,
    ignoreChainType?: boolean
  ) {
    super(chain, verbose);
    if (!ignoreChainType && !chainSupportedBy(this._chain, erc20Chains))
      throw new Error(`${chain} is not an ERC20 token`);

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
      log.error(
        `[Erc20::${this._chain}]: Fatal error occurred while starting the API`
      );
      throw error;
    }

    try {
      this._processor = new Processor(this._api, this._options.enricherConfig);
      this._subscriber = new Subscriber(this._api, this._chain, this._verbose);
    } catch (error) {
      log.error(
        `[Erc20::${this._chain}]: Fatal error occurred while starting the Processor and Subscriber`
      );
      throw error;
    }
  }

  public async subscribe(): Promise<void> {
    if (!this._subscriber) {
      log.info(
        `[Erc20::${this._chain}]: Subscriber isn't initialized. Please run init() first!`
      );
      return;
    }

    try {
      log.info(
        `[Erc20::${this._chain}]: Subscribing to the following token(s): ${
          this.options.tokenNames || '[token names not given!]'
        }, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      log.error(
        `[Erc20::${this._chain}]: Subscription error: ${error.message}`
      );
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
        log.error(`Event handle failure: ${err.message}`);
        break;
      }
    }
  }

  protected async processBlock(
    event: RawEvent,
    tokenName?: string
  ): Promise<void> {
    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const e of cwEvents) {
      // TODO: refactor chain/tokenName code in general
      e.chain = tokenName as never;
      await this.handleEvent(e as CWEvent);
    }
  }

  public get options(): Erc20ListenerOptions {
    return this._options;
  }
}
