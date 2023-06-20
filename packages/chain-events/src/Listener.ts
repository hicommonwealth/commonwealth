import type { Logger } from 'typescript-logging';

import type {
  IEventHandler,
  IChainEventKind,
  IEventSubscriber,
  IEventProcessor,
  IChainEventData,
  CWEvent,
  IStorageFetcher,
  IDisconnectedRange,
  SupportedNetwork,
} from './interfaces';
import { addPrefix, factory } from './logging';

let log;

// TODO: processBlock + processMissedBlocks can both be generalized and override in edge case listeners
// TODO: subscribe method can be implemented here and override in edge case (or use super.subscribe() in edge cases)
export abstract class Listener<
  Api,
  StorageFetcher extends IStorageFetcher<Api> | any,
  Processor extends IEventProcessor<Api, any>,
  Subscriber extends IEventSubscriber<Api, any> | any,
  EventKind extends IChainEventKind
> {
  public eventHandlers: {
    [key: string]: {
      handler: IEventHandler;
      excludedEvents: EventKind[];
    };
  };

  // events to be excluded regardless of handler (overrides handler specific excluded events
  public globalExcludedEvents: EventKind[];

  public storageFetcher: StorageFetcher;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public discoverReconnectRange: (chain: string) => Promise<IDisconnectedRange>;

  protected _subscriber: Subscriber;

  protected _processor: Processor;

  protected _api: Api;

  protected _subscribed: boolean;

  protected _lastCachedBlockNumber: number;

  protected readonly _chain: string;

  protected readonly _verbose: boolean;

  protected constructor(
    network: SupportedNetwork,
    chain: string,
    verbose?: boolean
  ) {
    this._chain = chain;
    this.eventHandlers = {};
    this._verbose = !!verbose;
    this.globalExcludedEvents = [];

    log = factory.getLogger(addPrefix(__filename, [network, chain]));
  }

  public abstract init(): Promise<void>;

  public abstract subscribe(): Promise<void>;

  public async unsubscribe(): Promise<void> {
    if (!this._subscriber) {
      log.warn(`Subscriber isn't initialized. Please run init() first!`);
      return;
    }

    if (!this._subscribed) {
      log.warn(`The listener is not subscribed`);
      return;
    }

    (<any>this._subscriber).unsubscribe();
    this._subscribed = false;
  }

  protected async handleEvent(event: CWEvent<IChainEventData>): Promise<void> {
    let prevResult;

    event.chain = this._chain;
    event.received = Date.now();

    for (const key of Object.keys(this.eventHandlers)) {
      const eventHandler = this.eventHandlers[key];
      if (
        !this.globalExcludedEvents.includes(event.data.kind as EventKind) &&
        !eventHandler.excludedEvents?.includes(event.data.kind as EventKind)
      ) {
        try {
          prevResult = await eventHandler.handler.handle(event, prevResult);
        } catch (err) {
          log.error(`Event handle failure: ${err.message}`);
          break;
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected abstract processBlock(block: any): Promise<void>;

  public get chain(): string {
    return this._chain;
  }

  public get subscribed(): boolean {
    return this._subscribed;
  }

  public abstract get options(): any;

  public get lastCachedBlockNumber(): number {
    return this._lastCachedBlockNumber;
  }

  public abstract getLatestBlockNumber(): Promise<number>;

  public async processOfflineRange(
    log: Logger
  ): Promise<{ startBlock: number; endBlock: number } | undefined> {
    log.info(`Detected offline time, polling missed blocks...`);

    if (!this.discoverReconnectRange) {
      log.info(
        `Unable to determine offline range - No discoverReconnectRange function given`
      );
    }

    // fetch the block number of the last event from database
    let offlineRange = await this.discoverReconnectRange(this._chain);

    if (
      this._lastCachedBlockNumber &&
      (!offlineRange.startBlock ||
        offlineRange.startBlock < this._lastCachedBlockNumber)
    ) {
      log.info(`Using cached block number ${this._lastCachedBlockNumber}`);
      offlineRange = { startBlock: this._lastCachedBlockNumber };
    }

    // do nothing if we don't have an existing event in the database/cache
    // (i.e. don't try and fetch all events from block 0 onward)
    if (!offlineRange.startBlock) {
      log.warn(`Unable to determine offline time range.`);
      return;
    }

    if (!offlineRange.endBlock) {
      offlineRange.endBlock = await this.getLatestBlockNumber();
      log.info(`Current endBlock: ${offlineRange.endBlock}`);
    }

    // limit max number of blocks to 500
    if (offlineRange.endBlock - offlineRange.startBlock > 500) {
      log.info(
        `Attempting to poll ${
          offlineRange.endBlock - offlineRange.startBlock
        } blocks, reducing query size to ${500}.`
      );
      offlineRange.startBlock = offlineRange.endBlock - 500;
    }

    return <{ startBlock: number; endBlock: number }>offlineRange;
  }

  public abstract isConnected(): Promise<boolean>;
}
