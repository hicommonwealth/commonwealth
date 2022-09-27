import {
  CWEvent,
  IDisconnectedRange,
  SupportedNetwork,
} from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { addPrefix, factory } from '../../logging';

import {
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
    super(SupportedNetwork.Compound, chain, verbose);

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Compound, this._chain])
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
      this._api = await createApi(this._options.url, 10 * 1000, this._chain);
    } catch (error) {
      this.log.error(`Fatal error occurred while starting the API`);
      throw error;
    }

    try {
      this._processor = new Processor(this._api, this._chain);
      this._subscriber = new Subscriber(
        this._api,
        this._chain,
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
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      this.log.error(`Subscription error: ${error.message}`);
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
    if (!this._lastBlockNumber || height > this._lastBlockNumber) {
      this._lastBlockNumber = height;
    }

    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const evt of cwEvents)
      await this.handleEvent(evt as CWEvent<IEventData>);
  }

  private async processMissedBlocks(): Promise<void> {
    this.log.info(`Detected offline time, polling missed blocks...`);

    if (!this.discoverReconnectRange) {
      this.log.info(
        `Unable to determine offline range - No discoverReconnectRange function given`
      );
      return;
    }

    // TODO: what to do about this offline range code for Cosmos?
    let offlineRange: IDisconnectedRange;
    try {
      // fetch the block of the last server event from database
      offlineRange = await this.discoverReconnectRange(this._chain);
      if (!offlineRange) {
        this.log.warn('No offline range found, skipping event catchup.');
        return;
      }
    } catch (error) {
      this.log.error(
        `Could not discover offline range: ${error.message}. Skipping event catchup.`
      );
      return;
    }

    // compare with default range algorithm: take last cached block in processor
    // if it exists, and is more recent than the provided algorithm
    // (note that on first run, we wont have a cached block/this wont do anything)
    if (
      this._lastBlockNumber &&
      (!offlineRange ||
        !offlineRange.startBlock ||
        offlineRange.startBlock < this._lastBlockNumber)
    ) {
      offlineRange = { startBlock: this._lastBlockNumber };
    }

    // if we can't figure out when the last block we saw was,
    // do nothing
    // (i.e. don't try and fetch all events from block 0 onward)
    if (!offlineRange || !offlineRange.startBlock) {
      this.log.warn(`Unable to determine offline time range.`);
      return;
    }

    try {
      const cwEvents = await this.storageFetcher.fetch();
      for (const event of cwEvents) {
        await this.handleEvent(event as CWEvent<IEventData>);
      }
    } catch (error) {
      this.log.error(`Unable to fetch events from storage: ${error.message}`);
    }
  }

  public get options(): CosmosListenerOptions {
    return this._options;
  }
}
