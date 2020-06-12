import { providers } from 'ethers';
import Web3 from 'web3';

import Subscriber from './subscriber';
import Processor from './processor';
import { IEventHandler, IEventSubscriber, IDisconnectedRange, CWEvent } from '../interfaces';
import StorageFetcher from './storageFetcher';

import { factory, formatFilename } from '../../logging';
import { IMolochEventData, MolochRawEvent, MolochApi } from './types';

import { Moloch1Factory } from '../../../eth/types/Moloch1Factory';
import { Moloch2Factory } from '../../../eth/types/Moloch2Factory';

const log = factory.getLogger(formatFilename(__filename));


/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export function createMolochApi(
  ethNetworkUrl: string,
  contractVersion: 1 | 2,
  contractAddress: string
): Promise<MolochApi> {
  const web3Provider = new Web3.providers.WebsocketProvider(ethNetworkUrl);
  const provider = new providers.Web3Provider(web3Provider);
  const contract = contractVersion === 1
    ? Moloch1Factory.connect(contractAddress, provider)
    : Moloch2Factory.connect(contractAddress, provider);
  return contract.deployed();
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
  chain: string, // contract name
  api: MolochApi,
  contractVersion: 1 | 2,
  handlers: IEventHandler<IMolochEventData>[],
  skipCatchup: boolean = true,
  discoverReconnectRange?: () => Promise<IDisconnectedRange>,
): Promise<IEventSubscriber<MolochApi, MolochRawEvent>> {
  // helper function that sends an event through event handlers
  const handleEventFn = async (event: CWEvent<IMolochEventData>) => {
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
  const processor = new Processor(contractVersion, api);
  const processEventFn = async (event: MolochRawEvent) => {
    // retrieve events from block
    const cwEvents: CWEvent<IMolochEventData>[] = await processor.process(event);

    // send all events through event-handlers in sequence
    await Promise.all(cwEvents.map((e) => handleEventFn(e)));
  };

  const subscriber = new Subscriber(api, chain);

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch skipped events
  const pollMissedEventsFn = async () => {
    if (!discoverReconnectRange) {
      log.warn('No function to discover offline time found, skipping event catchup.');
      return;
    }
    log.info('Fetching missed events since last startup...');
    const offlineRange = await discoverReconnectRange();
    if (!offlineRange) {
      log.warn('No offline range found, skipping event catchup.');
      return;
    }

    const fetcher = new StorageFetcher(api, contractVersion);
    try {
      const cwEvents = await fetcher.fetch(offlineRange);
      await Promise.all(cwEvents.map((e) => handleEventFn(e)));
    } catch (e) {
      log.error(`Unable to fetch events from storage: ${e.message}`);
    }
  };

  if (!skipCatchup) {
    await pollMissedEventsFn();
  } else {
    log.info('Skipping event catchup on startup!');
  }

  try {
    log.info(`Subscribing to Moloch contract ${chain}...`);
    subscriber.subscribe(processEventFn);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
}
