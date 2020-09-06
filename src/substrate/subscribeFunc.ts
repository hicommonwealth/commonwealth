import { WsProvider, ApiPromise } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import { RegistryTypes, OverrideModuleType } from '@polkadot/types/types';

import { IDisconnectedRange, CWEvent, SubscribeFunc, ISubscribeOptions } from '../interfaces';
import { Subscriber } from './subscriber';
import { Poller } from './poller';
import { Processor } from './processor';
import { Block, IEventData } from './types';

import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export async function createApi(
  url: string,
  types?: RegistryTypes,
  typesAlias?: Record<string, OverrideModuleType>,
): Promise<ApiPromise> {
  // construct provider
  const provider = new WsProvider(url);
  let unsubscribe: () => void;
  await new Promise((resolve) => {
    unsubscribe = provider.on('connected', () => resolve());
  });
  if (unsubscribe) unsubscribe();

  // construct API using provider
  const registry = new TypeRegistry();
  const api = new ApiPromise({
    provider,
    types,
    typesAlias,
    registry
  });
  return api.isReady;
}

/**
 * This is the main function for substrate event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 *
 * @param url The substrate chain endpoint to connect to.
 * @param handler An event handler object for processing received events.
 * @param skipCatchup If true, skip all fetching of "historical" chain data that may have been
 *                    emitted during downtime.
 * @param discoverReconnectRange A function to determine how long we were offline upon reconnection.
 * @returns An active block subscriber.
 */
export const subscribeEvents: SubscribeFunc<ApiPromise, Block, ISubscribeOptions<ApiPromise>> = async (options) => {
  const { chain, api, handlers, skipCatchup, discoverReconnectRange, verbose } = options;
  // helper function that sends an event through event handlers
  const handleEventFn = async (event: CWEvent<IEventData>) => {
    console.log(event);
    let prevResult = null;
    /* eslint-disable-next-line no-restricted-syntax */
    for (const handler of handlers) {
      try {
        // pass result of last handler into next one (chaining db events)
        /* eslint-disable-next-line no-await-in-loop */
        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        log.error(`Event handle failure: ${err.message}`);
        break;
      }
    }
  };

  // helper function that sends a block through the event processor and
  // into the event handlers
  const processor = new Processor(api);
  const processBlockFn = async (block: Block) => {
    // retrieve events from block
    const events: CWEvent<IEventData>[] = await processor.process(block);

    // send all events through event-handlers in sequence
    await Promise.all(events.map((event) => handleEventFn(event)));
  };

  const subscriber = new Subscriber(api, verbose);
  const poller = new Poller(api);

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch events from skipped blocks
  const pollMissedBlocksFn = async () => {
    log.info('Detected offline time, polling missed blocks...');
    // grab the cached block immediately to avoid a new block appearing before the
    // server can do its thing...
    const lastBlockNumber = processor.lastBlockNumber;

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
    if (lastBlockNumber
        && (!offlineRange || !offlineRange.startBlock || offlineRange.startBlock < lastBlockNumber)) {
      offlineRange = { startBlock: lastBlockNumber };
    }

    // if we can't figure out when the last block we saw was, do nothing
    // (i.e. don't try and fetch all events from block 0 onward)
    if (!offlineRange || !offlineRange.startBlock) {
      log.warn('Unable to determine offline time range.');
      return;
    }

    // poll the missed blocks for events
    try {
      const blocks = await poller.poll(offlineRange);
      await Promise.all(blocks.map(processBlockFn));
    } catch (e) {
      log.error(`Block polling failed after disconnect at block ${offlineRange.startBlock}`);
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
