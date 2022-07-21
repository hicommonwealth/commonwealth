import { Listener as BaseListener } from '../../Listener';
import {
  CWEvent,
  IDisconnectedRange,
  SupportedNetwork,
} from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import {
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

export class Listener extends BaseListener<
  Api,
  StorageFetcher,
  Processor,
  Subscriber,
  EventKind
> {
  public discoverReconnectRange: (chain: string) => Promise<IDisconnectedRange>;

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
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      this.log.error(`Subscription error: ${error.message}`);
    }
  }

  public async updateAddress(): Promise<void> {
    // TODO
  }

  private async processMissedBlocks(): Promise<void> {
    this.log.info(`Detected offline time, polling missed blocks...`);

    if (!this.discoverReconnectRange) {
      this.log.info(
        `Unable to determine offline range - No discoverReconnectRange function given`
      );
    }

    let offlineRange: IDisconnectedRange;
    try {
      offlineRange = await this.discoverReconnectRange(this._chain);
      if (!offlineRange) {
        this.log.warn(`No offline range found, skipping event catchup.`);
        return;
      }
    } catch (error) {
      this.log.error(
        `Could not discover offline range: ${error.message}. Skipping event catchup.`
      );
      return;
    }

    if (!offlineRange || !offlineRange.startBlock) {
      this.log.warn(`Unable to determine offline time range.`);
      return;
    }

    try {
      const cwEvents = await this.storageFetcher.fetch(offlineRange);
      for (const event of cwEvents) {
        await this.handleEvent(event);
      }
    } catch (error) {
      this.log.error(`Unable to fetch events from storage: ${error.message}`);
    }
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const { blockNumber } = event;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    const cwEvents: CWEvent[] = await this._processor.process(event);

    for (const evt of cwEvents) {
      await this.handleEvent(evt as CWEvent<IEventData>);
    }
  }

  public get options(): AaveListenerOptions {
    return this._options;
  }
}
