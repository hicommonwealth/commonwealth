import type { CWEvent, IDisconnectedRange } from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { addPrefix, factory } from '../../logging';

import type {
  Api,
  EventKind,
  IEventData,
  ListenerOptions as CosmosListenerOptions,
  RawEvent,
} from './types';
import { createApi } from './subscribeFunc';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import { Subscriber } from './subscriber';

export class Listener extends BaseListener<
  Api,
  StorageFetcher,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: CosmosListenerOptions;

  protected readonly log;

  constructor(
    chain: string,
    url?: string,
    skipCatchup?: boolean,
    pollTime?: number,
    verbose?: boolean,
    discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>
  ) {
    super(SupportedNetwork.Cosmos, chain, verbose);

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Cosmos, this._origin])
    );

    this._options = {
      url,
      skipCatchup: !!skipCatchup,
      pollTime,
    };

    this._subscribed = false;
    this.discoverReconnectRange = discoverReconnectRange;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(this._options.url, 10 * 1000, this._origin);
    } catch (error) {
      this.log.error(`Fatal error occurred while starting the API`);
      throw error;
    }

    try {
      this._processor = new Processor(this._api, this._origin);
      this._subscriber = new Subscriber(
        this._api,
        this._origin,
        this._options.pollTime,
        this._verbose
      );
    } catch (error) {
      this.log.error(
        `Fatal error occurred while starting the Processor, and Subscriber`
      );
      throw error;
    }

    try {
      this.storageFetcher = new StorageFetcher(this._api, this._origin);
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
        `Subscriber for ${this._origin} isn't initialized. Please run init() first!`
      );
      return;
    }

    // processed blocks missed during downtime
    let offlineRange: IDisconnectedRange | null;
    if (!this._options.skipCatchup) {
      offlineRange = await this.processMissedBlocks();
    } else this.log.info(`Skipping event catchup on startup!`);

    try {
      this.log.info(
        `Subscribing to Cosmos chain: ${this._origin}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(
        this.processBlock.bind(this),
        offlineRange
      );
      this._subscribed = true;
    } catch (error) {
      this.log.error(`Subscription error: ${error.message}`);
      throw error;
    }
  }

  public async updateUrl(url: string): Promise<void> {
    if (url === this._options.url) {
      this.log.warn(`The chain URL is already set to ${url}`);
      return;
    }
    this._options.url = url;

    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const { height } = event;
    if (!this._lastCachedBlockNumber || height > this._lastCachedBlockNumber) {
      this._lastCachedBlockNumber = height;
    }

    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const evt of cwEvents)
      await this.handleEvent(evt as CWEvent<IEventData>);
  }

  private async processMissedBlocks(): Promise<IDisconnectedRange | null> {
    const offlineRange = await this.processOfflineRange(this.log);
    if (!offlineRange) return;
    return offlineRange;
  }

  public get options(): CosmosListenerOptions {
    return this._options;
  }

  public async getLatestBlockNumber(): Promise<number> {
    return (await this._api.tm.block()).block.header.height;
  }

  public async isConnected(): Promise<boolean> {
    // cosmos querying is polling/HTTP based so there is no
    // long-running WebSocket connection we can check the status for
    // this function will be deprecated when we switch all listeners
    // to HTTP polling
    return true;
  }
}
