import sleep from 'sleep-promise';

import { createProvider } from '../eth';
import { CWEvent, SubscribeFunc, ISubscribeOptions } from '../interfaces';
import { factory, formatFilename } from '../logging';
import { ERC20__factory as ERC20Factory } from '../contractTypes';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import { IEventData, RawEvent, Api } from './types';
import { EnricherConfig } from './filters/enricher';

const log = factory.getLogger(formatFilename(__filename));

export interface IErc20SubscribeOptions extends ISubscribeOptions<Api> {
  enricherConfig?: EnricherConfig;
}

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export async function createApi(
  ethNetworkUrl: string,
  tokenAddresses: string[],
  retryTimeMs = 10 * 1000
): Promise<Api> {
  try {
    const provider = createProvider(ethNetworkUrl);

    const tokenContracts = tokenAddresses.map((o) =>
      ERC20Factory.connect(o, provider)
    );
    const deployResults = await Promise.all(
      tokenContracts.map((o) =>
        o
          .deployed()
          .then(() => {
            return { token: o, deployed: true };
          })
          .catch((err) => {
            log.error('Failed to deploy', err);
            return { token: o, deployed: false };
          })
      )
    );

    const result = deployResults.filter((o) => o.deployed).map((o) => o.token);

    log.info('Connection successful!');
    return { tokens: result, provider };
  } catch (err) {
    log.error(`Erc20 at ${ethNetworkUrl} failure: ${err.message}`);
    await sleep(retryTimeMs);
    log.error('Retrying connection...');
    return createApi(ethNetworkUrl, tokenAddresses, retryTimeMs);
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
  IErc20SubscribeOptions
> = async (options) => {
  const { chain, api, handlers, verbose } = options;
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

  try {
    log.info(`Subscribing to ERC20 contracts ${chain}...`);
    await subscriber.subscribe(processEventFn);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
};
