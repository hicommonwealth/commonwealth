import EthDater from 'ethereum-block-by-date';
import sleep from 'sleep-promise';

import { createProvider } from '../eth';
import {
  IDisconnectedRange,
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
} from '../interfaces';
import log from '../logging';
import {
  MPond__factory as MPondFactory,
  GovernorAlpha__factory as GovernorAlphaFactory,
  Timelock__factory as TimelockFactory,
} from '../contractTypes';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import { IEventData, RawEvent, Api } from './types';

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export async function createApi(
  ethNetworkUrl: string,
  governorAlphaAddress: string,
  retryTimeMs = 10 * 1000
): Promise<Api> {
  try {
    const provider = createProvider(ethNetworkUrl);

    // init governance contract
    const governorAlphaContract = GovernorAlphaFactory.connect(
      governorAlphaAddress,
      provider
    );
    await governorAlphaContract.deployed();

    // init secondary contracts
    const compAddress = await governorAlphaContract.MPond();
    const timelockAddress = await governorAlphaContract.timelock();
    const compContract = MPondFactory.connect(compAddress, provider);
    const timelockContract = TimelockFactory.connect(timelockAddress, provider);
    await Promise.all([compContract.deployed(), timelockContract.deployed()]);

    log.info('Connection successful!');
    return {
      comp: compContract,
      governorAlpha: governorAlphaContract,
      timelock: timelockContract,
    };
  } catch (err) {
    log.error(
      `Marlin ${governorAlphaAddress} at ${ethNetworkUrl} failure: ${err.message}`
    );
    await sleep(retryTimeMs);
    log.error('Retrying connection...');
    return createApi(ethNetworkUrl, governorAlphaAddress, retryTimeMs);
  }
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
export const subscribeEvents: SubscribeFunc<
  Api,
  RawEvent,
  ISubscribeOptions<Api>
> = async (options) => {
  const {
    chain,
    api,
    handlers,
    skipCatchup,
    discoverReconnectRange,
    verbose,
  } = options;
  // helper function that sends an event through event handlers
  const handleEventFn = async (event: CWEvent<IEventData>): Promise<void> => {
    let prevResult = null;
    for (const handler of handlers) {
      try {
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
  const processor = new Processor(api);
  const processEventFn = async (event: RawEvent): Promise<void> => {
    // retrieve events from block
    const cwEvents: CWEvent<IEventData>[] = await processor.process(event);

    // process events in sequence
    for (const cwEvent of cwEvents) {
      await handleEventFn(cwEvent);
    }
  };

  const subscriber = new Subscriber(api, chain, verbose);

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch skipped events
  const pollMissedEventsFn = async (): Promise<void> => {
    if (!discoverReconnectRange) {
      log.warn(
        'No function to discover offline time found, skipping event catchup.'
      );
      return;
    }
    log.info(`Fetching missed events since last startup of ${chain}...`);
    let offlineRange: IDisconnectedRange;
    try {
      offlineRange = await discoverReconnectRange();
      if (!offlineRange) {
        log.warn('No offline range found, skipping event catchup.');
        return;
      }
    } catch (e) {
      log.error(
        `Could not discover offline range: ${e.message}. Skipping event catchup.`
      );
      return;
    }

    // defaulting to the governorAlpha contract provider, though could be any of the contracts
    const dater = new EthDater(api.governorAlpha.provider);
    const fetcher = new StorageFetcher(api, dater);
    try {
      const cwEvents = await fetcher.fetch(offlineRange);

      // process events in sequence
      for (const cwEvent of cwEvents) {
        await handleEventFn(cwEvent);
      }
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
    log.info(`Subscribing to Marlin contracts ${chain}...`);
    await subscriber.subscribe(processEventFn);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
};
