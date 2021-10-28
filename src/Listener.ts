import * as net from 'net';

import {
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
import { addPrefix, factory, formatFilename } from './logging';

let log;

// TODO: processBlock + processMissedBlocks can both be generalized and override in edge case listeners
// TODO: subscribe method can be implemented here and override in edge case (or use super.subscribe() in edge cases)
export abstract class Listener<
  Api,
  StorageFetcher extends IStorageFetcher<Api>,
  Processor extends IEventProcessor<Api, any>,
  Subscriber extends IEventSubscriber<Api, any>,
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

  public discoverReconnectRange: (chain: string) => Promise<IDisconnectedRange>;

  protected _subscriber: Subscriber;

  protected _processor: Processor;

  protected _api: Api;

  protected _subscribed: boolean;

  protected _lastBlockNumber: number;

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

    this._subscriber.unsubscribe();
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

  protected abstract processBlock(block: any): Promise<void>;

  public get chain(): string {
    return this._chain;
  }

  public get subscribed(): boolean {
    return this._subscribed;
  }

  public abstract get options(): any;

  public get lastBlockNumber(): number {
    return this._lastBlockNumber;
  }
}
