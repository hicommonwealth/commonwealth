import sleep from 'sleep-promise';

import { createProvider } from '../../eth';
import { CWEvent, SubscribeFunc, ISubscribeOptions } from '../../interfaces';
import { factory, formatFilename } from '../../logging';
import { ERC20__factory as ERC20Factory } from '../../contractTypes';

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
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param tokenNames
 * @param retryTimeMs
 * @returns a promise resolving to an ApiPromise once the connection has been established

 */
export async function createApi(
  ethNetworkUrl: string,
  tokenAddresses: string[],
  retryTimeMs = 10 * 1000,
  tokenNames?: string[]
): Promise<Api> {
  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(ethNetworkUrl);

      const tokenContracts = tokenAddresses.map((o) =>
        ERC20Factory.connect(o, provider)
      );
      const deployResults = await Promise.all(
        tokenContracts.map((o, index) =>
          o
            .deployed()
            .then(() => {
              return {
                token: o,
                deployed: true,
                tokenName: tokenNames ? tokenNames[index] : undefined,
              };
            })
            .catch((err) => {
              log.error('Failed to find token', err);
              return {
                token: o,
                deployed: false,
                tokenName: tokenNames ? tokenNames[index] : undefined,
              };
            })
        )
      );

      const result = deployResults.filter((o) => o.deployed);

      log.info(`[erc20]: Connection to ${ethNetworkUrl} successful!`);
      return {
        tokens: result.map((o) => o.token),
        provider,
        tokenNames: result.map((o) => o.tokenName),
      };
    } catch (err) {
      log.error(`Erc20 at ${ethNetworkUrl} failure: ${err.message}`);
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
    }
  }

  throw new Error(
    `Failed to start the ERC20 listener for ${tokenAddresses} at ${ethNetworkUrl}`
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
  IErc20SubscribeOptions
> = async (options) => {
  const { chain, api, handlers, verbose } = options;
  // helper function that sends an event through event handlers
  const handleEventFn = async (event: CWEvent<IEventData>): Promise<void> => {
    let prevResult = null;
    for (const handler of handlers) {
      try {
        event.chain = chain;
        event.received = Date.now();
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
  const processEventFn = async (
    event: RawEvent,
    tokenName?: string
  ): Promise<void> => {
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
