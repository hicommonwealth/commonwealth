import sleep from 'sleep-promise';

import type {
  IDisconnectedRange,
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import type { Api, IEventData, RawEvent } from './types';

export interface ICosmosSubscribeOptions extends ISubscribeOptions<Api> {
  pollTime?: number;
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
  retryTimeMs = 10 * 1000,
  chain?: string
): Promise<Api> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Cosmos, chain])
  );
  for (let i = 0; i < 3; ++i) {
    try {
      const tendermint = await import('@cosmjs/tendermint-rpc');
      const tm = await tendermint.Tendermint34Client.connect(url);
      const cosm = await import('@cosmjs/stargate');
      const rpc = cosm.QueryClient.withExtensions(
        tm,
        cosm.setupGovExtension,
        cosm.setupStakingExtension,
        cosm.setupBankExtension
      );
      const { createLCDClient } = await import(
        'common-common/src/cosmos-ts/src/codegen/cosmos/lcd'
      );
      const lcd = await createLCDClient({
        restEndpoint: url,
      });
      return { tm, rpc, lcd };
    } catch (err) {
      log.error(`Cosmos chain at url: ${url} failure: ${err.message}`);
      await sleep(retryTimeMs);
      log.error(`Retrying connection...`);
    }
  }

  throw new Error(
    `[${SupportedNetwork.Cosmos}${
      chain ? `::${chain}` : ''
    }]: Failed to start Cosmos chain at ${url}`
  );
}

/**
 * This is the main function for substrate event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export const subscribeEvents: SubscribeFunc<
  Api,
  RawEvent,
  ICosmosSubscribeOptions
> = async (options) => {
  const {
    chain,
    api,
    handlers,
    skipCatchup,
    discoverReconnectRange,
    verbose,
    pollTime,
  } = options;
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Cosmos, chain])
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

  const subscriber = new Subscriber(api, chain, pollTime, verbose);

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch skipped events
  const getDisconnectedRange = async (): Promise<IDisconnectedRange> => {
    if (!discoverReconnectRange) {
      log.warn(
        'No function to discover offline time found, skipping event catchup.'
      );
      return {};
    }
    log.info(`Fetching missed events since last startup of ${chain}...`);
    try {
      const offlineRange = await discoverReconnectRange();
      if (!offlineRange) {
        log.warn('No offline range found, skipping event catchup.');
        return {};
      }
      return offlineRange;
    } catch (e) {
      log.error(
        `Could not discover offline range: ${e.message}. Skipping event catchup.`
      );
    }
    return {};
  };

  let disconnectedRange: IDisconnectedRange;
  if (!skipCatchup) {
    disconnectedRange = await getDisconnectedRange();
  } else {
    log.info('Skipping event catchup on startup!');
  }

  try {
    log.info(`Subscribing to Compound contracts ${chain}...`);
    await subscriber.subscribe(processEventFn, disconnectedRange);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
};
