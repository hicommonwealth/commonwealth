import Subscriber from './subscriber';
import Poller from './poller';
import Processor from './processor';
import { IEventHandler, IBlockSubscriber, IDisconnectedRange, CWEvent } from '../interfaces';
import migrate from './migration';

import { factory, formatFilename } from '../../../server/util/logging';
import { IMolochEventData } from './types';
const log = factory.getLogger(formatFilename(__filename));

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export function createApi(): any {
  // TODO
}

/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 *
 * @param url The edgeware chain endpoint to connect to.
 * @param handler An event handler object for processing received events.
 * @param skipCatchup If true, skip all fetching of "historical" chain data that may have been
 *                    emitted during downtime.
 * @param discoverReconnectRange A function to determine how long we were offline upon reconnection.
 * @returns An active block subscriber.
 */
export default async function (
  chain: string,
  url = 'ws://localhost:9944',
  handlers: IEventHandler[],
  skipCatchup: boolean,
  discoverReconnectRange?: () => Promise<IDisconnectedRange>,
  performMigration?: boolean,
): Promise<IBlockSubscriber<any, any>> {
  const api = await createApi();

  // helper function that sends an event through event handlers
  const handleEventFn = async (event: any) => {
    let prevResult = null;
    /* eslint-disable-next-line no-restricted-syntax */
    for (const handler of handlers) {
      try {
        // pass result of last handler into next one (chaining db events)
        /* eslint-disable-next-line no-await-in-loop */
        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        log.error(`Event handle failure: ${JSON.stringify(err, null, 4)}`);
        break;
      }
    }
  };

  // helper function that sends a block through the event processor and
  // into the event handlers
  const processor = new Processor(api);
  const processBlockFn = async (block: any) => {
    // retrieve events from block
    const events: CWEvent<IMolochEventData>[] = await processor.process(block);

    // send all events through event-handlers in sequence
    await Promise.all(events.map((event) => handleEventFn(event)));
  };

  // special case to perform a migration on first run
  // returns early, does not initialize the subscription
  if (performMigration) {
    // TODO
    log.info(`Starting event migration for Moloch contract at ${url}.`);
    const events = await migrate(api);
    await Promise.all(events.map((event) => handleEventFn(event)));
    return;
  }

  const subscriber = new Subscriber(api);
  const poller = new Poller(api);

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch events from skipped blocks
  const pollMissedBlocksFn = async () => {
    log.info('Detected offline time, polling missed blocks...');
    // TODO
  };

  if (!skipCatchup) {
    pollMissedBlocksFn();
  } else {
    log.info('Skipping event catchup on startup!');
  }

  try {
    log.info(`Subscribing to Substrate endpoint at ${url}...`);
    subscriber.subscribe(processBlockFn);
  } catch (e) {
    log.error(`Subscription error: ${JSON.stringify(e, null, 2)}`);
  }

  return subscriber;
}
