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
  IAaveGovernanceV2__factory as IAaveGovernanceV2Factory,
  GovernanceStrategy__factory as GovernanceStrategyFactory,
  GovernancePowerDelegationERC20__factory as GovernancePowerDelegationERC20Factory,
} from '../../contractTypes';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import type { IEventData, RawEvent, Api } from './types';

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
  governanceAddress: string,
  retryTimeMs = 10 * 1000,
  chain?: string
): Promise<Api> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Aave, chain])
  );
  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(
        ethNetworkUrl,
        SupportedNetwork.Aave,
        chain
      );

      // fetch governance contract
      const governanceContract = IAaveGovernanceV2Factory.connect(
        governanceAddress,
        provider
      );
      await governanceContract.deployed();

      try {
        // fetch strategy to get tokens
        // TODO: ensure that all governance contracts have a valid strategy
        //   i.e. with these specific tokens -- we may want to take the token addresses
        //   directly rather than fetch from the contract.
        const strategyAddress =
          await governanceContract.getGovernanceStrategy();
        const strategy = GovernanceStrategyFactory.connect(
          strategyAddress,
          provider
        );
        await strategy.deployed();

        // fetch tokens
        const aaveTokenAddress = await strategy.AAVE();
        const stkAaveTokenAddress = await strategy.STK_AAVE();
        const aaveToken = GovernancePowerDelegationERC20Factory.connect(
          aaveTokenAddress,
          provider
        );
        const stkAaveToken = GovernancePowerDelegationERC20Factory.connect(
          stkAaveTokenAddress,
          provider
        );
        await aaveToken.deployed();
        await stkAaveToken.deployed();

        // confirm we the token types are correct
        await aaveToken.DELEGATE_TYPEHASH();
        await stkAaveToken.DELEGATE_TYPEHASH();

        log.info('Connection successful!');
        return {
          governance: governanceContract,
          aaveToken,
          stkAaveToken,
        };
      } catch (err) {
        log.warn(
          'Governance connection successful but token connections failed.'
        );
        log.warn('Delegation events will not be emitted.');
        return {
          governance: governanceContract,
        };
      }
    } catch (err) {
      log.error(
        `Aave ${governanceAddress} at ${ethNetworkUrl} failure: ${err.message}`
      );
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
    }
  }

  throw new Error(
    `[${SupportedNetwork.Aave} ${
      chain ? `::${chain}` : ''
    }]: Failed to start Aave listener for ${governanceAddress} at ${ethNetworkUrl}`
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
  const { chain, api, handlers, skipCatchup, discoverReconnectRange, verbose } =
    options;
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Aave, chain])
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
    // TODO: fix or remove the local listener script which utilizes this function
    // await subscriber.subscribe(processEventFn, );
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
};
