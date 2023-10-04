import type { providers } from 'ethers';
import sleep from 'sleep-promise';

import { createProvider } from '../../eth';
import type {
  IDisconnectedRange,
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';
import {
  GovernorAlpha__factory as GovernorAlphaFactory,
  GovernorCompatibilityBravo__factory as GovernorCompatibilityBravoFactory,
} from '../../contractTypes';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import type { IEventData, RawEvent, Api } from './types';

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @returns a promise resolving to an ApiPromise once the connection has been established
 * @param ethNetworkUrlOrProvider
 * @param governorAddress
 * @param retryTimeMs
 * @param chain
 */
export async function createApi(
  ethNetworkUrlOrProvider: string | providers.JsonRpcProvider,
  governorAddress: string,
  retryTimeMs = 10 * 1000,
  chain?: string
): Promise<Api> {
  const ethNetworkUrl =
    typeof ethNetworkUrlOrProvider === 'string'
      ? ethNetworkUrlOrProvider
      : ethNetworkUrlOrProvider.connection.url;
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Compound, chain])
  );

  for (let i = 0; i < 3; ++i) {
    try {
      const provider =
        typeof ethNetworkUrlOrProvider === 'string'
          ? await createProvider(
              ethNetworkUrlOrProvider,
              SupportedNetwork.Compound,
              chain
            )
          : ethNetworkUrlOrProvider;

      let contract: Api;
      try {
        contract = GovernorAlphaFactory.connect(governorAddress, provider);
        await contract.deployed();
        await contract.guardian();
        log.info(`Found GovAlpha contract at ${contract.address}`);
      } catch (e) {
        contract = GovernorCompatibilityBravoFactory.connect(
          governorAddress,
          provider
        );
        await contract.deployed();
        log.info(
          `Found non-GovAlpha Compound contract at ${contract.address}, using GovernorCompatibilityBravo`
        );
      }

      log.info(`Connection successful!`);
      return contract;
    } catch (err) {
      log.error(
        `Compound contract: ${governorAddress} at url: ${ethNetworkUrl} failure: ${err.message}`
      );
      await sleep(retryTimeMs);
      log.error(`Retrying connection...`);
    }
  }

  throw new Error(
    `[${SupportedNetwork.Compound}${
      chain ? `::${chain}` : ''
    }]: Failed to start Compound listener for ${governorAddress} at ${ethNetworkUrl}`
  );
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
  const { chain, api, handlers, skipCatchup, discoverReconnectRange, verbose } =
    options;
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Compound, chain])
  );
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
    const fetcher = new StorageFetcher(api);
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
    log.info(`Subscribing to Compound contracts ${chain}...`);
    // TODO: fix or remove
    // await subscriber.subscribe(processEventFn);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
};
