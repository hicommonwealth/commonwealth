import { providers } from 'ethers';
import Web3 from 'web3';
import { WebsocketProvider } from 'web3-core/types';
import { Web3Provider } from 'ethers/providers';
import EthDater from 'ethereum-block-by-date';
import sleep from 'sleep-promise';

import { MPondFactory } from './contractTypes/MPondFactory';
import { GovernorAlphaFactory } from './contractTypes/GovernorAlphaFactory';
import { TimelockFactory } from './contractTypes/TimelockFactory';

import { IDisconnectedRange, CWEvent, SubscribeFunc, ISubscribeOptions } from '../interfaces';
import { Subscriber } from './subscriber';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import { IEventData, RawEvent, Api } from './types';

import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export async function createApi(
  ethNetworkUrl: string,
  contractAddresses: {
    comp: string,
    governorAlpha: string,
    timelock: string
  },
  retryTimeMs = 10 * 1000,
): Promise<Api> {
  if (ethNetworkUrl.includes('infura')) {
    if (process && process.env) {
      const INFURA_API_KEY = process.env.INFURA_API_KEY;
      if (!INFURA_API_KEY) {
        throw new Error('no infura key found!');
      }
      ethNetworkUrl = `wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}`;
    } else {
      throw new Error('must use nodejs to connect to infura provider!');
    }
  }
  try {
    const web3Provider = new Web3.providers.WebsocketProvider(
      ethNetworkUrl,
      {
        reconnect: {
          auto: true,
          delay: retryTimeMs,
          onTimeout: true,
        }
      } as any,
    );
    const provider = new providers.Web3Provider(web3Provider);
    const compContract = CompFactory.connect(contractAddresses.comp, provider);
    const governorAlphaContract = GovernorAlphaFactory.connect(contractAddresses.governorAlpha, provider);
    const timelockContract = TimelockFactory.connect(contractAddresses.timelock, provider);
    await Promise.all([
      compContract.deployed(),
      governorAlphaContract.deployed(),
      timelockContract.deployed(),
    ]);
    
    log.info('Connection successful!');
    return {
      comp: compContract,
      governorAlpha: governorAlphaContract,
      timelock: timelockContract,
    };
  } catch (err) {
    log.error(`Marlin ${contractAddresses.toString()} at ${ethNetworkUrl} failure: ${err.message}`);
    await sleep(retryTimeMs);
    log.error('Retrying connection...');
    return createApi(ethNetworkUrl, contractAddresses, retryTimeMs);
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
export const subscribeEvents: SubscribeFunc<Api, RawEvent, ISubscribeOptions<Api>> = async (options) => {
  const { chain, api, handlers, skipCatchup, discoverReconnectRange, verbose } = options;
  // helper function that sends an event through event handlers
  const handleEventFn = async (event: CWEvent<IEventData>) => {
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
  const processEventFn = async (event: RawEvent) => {
    // retrieve events from block
    const cwEvents: CWEvent<IEventData>[] = await processor.process(event);

    // process events in sequence
    for (const cwEvent of cwEvents) {
      // eslint-disable-next-line no-await-in-loop
      await handleEventFn(cwEvent);
    }
  };

  const subscriber = new Subscriber(api, chain, verbose);

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch skipped events
  const pollMissedEventsFn = async () => {
    if (!discoverReconnectRange) {
      log.warn('No function to discover offline time found, skipping event catchup.');
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
      log.error(`Could not discover offline range: ${e.message}. Skipping event catchup.`);
      return;
    }

    // reuse provider interface for dater function
    // defaulting to the comp contract provider, though could be any of the contracts
    const web3 = new Web3((api.comp.provider as Web3Provider)._web3Provider as WebsocketProvider);
    const dater = new EthDater(web3);
    const fetcher = new StorageFetcher(api, dater);
    try {
      const cwEvents = await fetcher.fetch(offlineRange);

      // process events in sequence
      for (const cwEvent of cwEvents) {
        // eslint-disable-next-line no-await-in-loop
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