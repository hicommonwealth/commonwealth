import sleep from 'sleep-promise';

import { createProvider } from '../../eth';
import {
  IDisconnectedRange,
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
  SupportedNetwork,
} from '../../interfaces';
import { addPrefix, factory } from '../../logging';
import { IProjectBaseFactory__factory as IProjectBaseFactoryFactory } from '../../contractTypes';

import { Subscriber, constructProjectApi } from './subscriber';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import { IEventData, RawEvent, Api } from './types';

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param ethNetworkUrl
 * @param governanceAddress
 * @param retryTimeMs
 * @param chain
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export async function createApi(
  ethNetworkUrl: string,
  factoryAddress: string,
  retryTimeMs = 10 * 1000,
  chain?: string
): Promise<Api> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Commonwealth, chain])
  );
  const api: Api = { factory: null, projects: [] };
  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(
        ethNetworkUrl,
        SupportedNetwork.Commonwealth,
        chain
      );

      api.factory = IProjectBaseFactoryFactory.connect(
        factoryAddress,
        provider
      );
      await api.factory.deployed();

      // create subscriptions for all existing projects
      const nProjects = await api.factory.numProjects();
      for (let projectN = 1; projectN <= nProjects.toNumber(); projectN++) {
        const projectAddress = await api.factory.projects(projectN);
        const project = await constructProjectApi(api.factory, projectAddress);
        api.projects.push(project);
        /*
          Do not subscribe to tokens for time being

        project.bToken.on(
          '*',
          this._listener.bind(this, project.bToken.address, ContractType.bToken)
        );
        if (project.cToken && project.isCurated) {
          project.cToken.on(
            '*',
            this._listener.bind(this, project.cToken.address, ContractType.cToken)
          );
        }
        */
      }

      log.info('Connection successful!');
      return api;
    } catch (err) {
      log.error(
        `Commonwealth ${factoryAddress} at ${ethNetworkUrl} failure: ${err.message}`
      );
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
    }
  }

  throw new Error(
    `[${SupportedNetwork.Commonwealth} ${
      chain ? `::${chain}` : ''
    }]: Failed to start Commonwealth listener for ${factoryAddress} at ${ethNetworkUrl}`
  );
}

/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
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
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Commonwealth, chain])
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
    log.info(`Subscribing to contracts ${chain}...`);
    await subscriber.subscribe(processEventFn);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
};
