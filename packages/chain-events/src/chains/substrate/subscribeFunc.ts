import { WsProvider } from '@polkadot/rpc-provider/ws';
import type { ApiPromise } from '@polkadot/api/promise';
import type { RegisteredTypes } from '@polkadot/types/types';

import type {
  IDisconnectedRange,
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { Subscriber } from './subscriber';
import { Poller } from './poller';
import { Processor } from './processor';
import type { Block, IEventData } from './types';
import type { EnricherConfig } from './filters/enricher';

export interface ISubstrateSubscribeOptions
  extends ISubscribeOptions<ApiPromise> {
  enricherConfig?: EnricherConfig;
}

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @param typeOverrides
 * @param chain
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export async function createApi(
  url: string,
  typeOverrides: RegisteredTypes = {},
  chain?: string
): Promise<ApiPromise> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Substrate, chain])
  );
  for (let i = 0; i < 3; ++i) {
    const provider = new WsProvider(url, 0);
    let unsubscribe: () => void;
    const success = await new Promise<boolean>((resolve) => {
      unsubscribe = provider.on('connected', () => resolve(true));

      provider.on('error', () => {
        if (i < 2)
          log.warn(`An error occurred connecting to ${url} - retrying...`);
        resolve(false);
      });

      provider.on('disconnected', () => resolve(false));

      provider.connect();
    });

    // construct API using provider
    if (success) {
      unsubscribe();
      const polkadot = await import('@polkadot/api/promise');
      return polkadot.ApiPromise.create({
        provider,
        ...typeOverrides,
      });
    }
    // TODO: add delay
  }

  throw new Error(
    `[${SupportedNetwork.Substrate}${
      chain ? `::${chain}` : ''
    }]: Failed to connect to API endpoint at: ${url}`
  );
}

/**
 * This is the main function for substrate event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export const subscribeEvents: SubscribeFunc<
  ApiPromise,
  Block,
  ISubstrateSubscribeOptions
> = async (options) => {
  const {
    chain,
    api,
    handlers,
    skipCatchup,
    archival,
    startBlock,
    discoverReconnectRange,
    verbose,
    enricherConfig,
  } = options;
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Substrate, chain])
  );
  // helper function that sends an event through event handlers
  const handleEventFn = async (event: CWEvent<IEventData>): Promise<void> => {
    let prevResult = null;
    for (const handler of handlers) {
      try {
        event.chain = chain;
        event.received = Date.now();

        // pass result of last handler into next one (chaining db events)
        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        log.error(`Event handle failure: ${err.message}`);
        break;
      }
    }
  };

  // helper function that sends a block through the event processor and
  // into the event handlers
  const processor = new Processor(api, enricherConfig || {});
  const processBlockFn = async (block: Block): Promise<void> => {
    // retrieve events from block
    const events: CWEvent<IEventData>[] = await processor.process(block);

    // send all events through event-handlers in sequence
    for (const event of events) await handleEventFn(event);
  };

  const subscriber = new Subscriber(api, verbose);
  const poller = new Poller(api);

  // if running in archival mode: run poller.archive with batch_size 50
  // then exit without subscribing.
  // TODO: should we start subscription?
  if (archival) {
    // default to startBlock 0
    const offlineRange: IDisconnectedRange = { startBlock: startBlock ?? 0 };
    log.info(
      `Executing in archival mode, polling blocks starting from: ${offlineRange.startBlock}`
    );
    await poller.archive(offlineRange, 50, processBlockFn);
    return subscriber;
  }

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch events from skipped blocks
  const pollMissedBlocksFn = async (): Promise<void> => {
    log.info('Detected offline time, polling missed blocks...');
    // grab the cached block immediately to avoid a new block appearing before the
    // server can do its thing...
    const { lastBlockNumber } = processor;
    // determine how large of a reconnect we dealt with
    let offlineRange: IDisconnectedRange;

    // first, attempt the provided range finding method if it exists
    // (this should fetch the block of the last server event from database)
    if (discoverReconnectRange) {
      offlineRange = await discoverReconnectRange();
    }

    // compare with default range algorithm: take last cached block in processor
    // if it exists, and is more recent than the provided algorithm
    // (note that on first run, we wont have a cached block/this wont do anything)
    if (
      lastBlockNumber &&
      (!offlineRange ||
        !offlineRange.startBlock ||
        offlineRange.startBlock < lastBlockNumber)
    ) {
      offlineRange = { startBlock: lastBlockNumber };
    }

    // if we can't figure out when the last block we saw was,
    // do nothing
    // (i.e. don't try and fetch all events from block 0 onward)
    if (!offlineRange || !offlineRange.startBlock) {
      log.warn('Unable to determine offline time range.');
      return;
    }
    try {
      const blocks = await poller.poll(offlineRange);
      await Promise.all(blocks.map(processBlockFn));
    } catch (e) {
      log.error(
        `Block polling failed after disconnect at block ${offlineRange.startBlock}`
      );
    }
  };

  if (!skipCatchup) {
    await pollMissedBlocksFn();
  } else {
    log.info('Skipping event catchup on startup!');
  }

  try {
    log.info(`Subscribing to ${chain} endpoint...`);
    await subscriber.subscribe(processBlockFn);

    // handle reconnects with poller
    api.on('connected', pollMissedBlocksFn);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }
  return subscriber;
};
