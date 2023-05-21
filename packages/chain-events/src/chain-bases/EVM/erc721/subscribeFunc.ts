import sleep from 'sleep-promise';
import _ from 'underscore';

import { createProvider } from '../../../eth';
import type {
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
} from '../../../interfaces';
import { SupportedNetwork } from '../../../interfaces';
import { addPrefix, factory } from '../../../logging';
import type { ERC721 } from '../../../contractTypes';
import { ERC721__factory as ERC721Factory } from '../../../contractTypes';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import type { IEventData, RawEvent, IErc721Contracts } from './types';

export interface IErc721SubscribeOptions
  extends ISubscribeOptions<IErc721Contracts> {
  enricherConfig?;
}

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param chainName
 * @param retryTimeMs
 * @returns a promise resolving to an ApiPromise once the connection has been established

 */
export async function createApi(
  ethNetworkUrl: string,
  tokenAddresses: string[],
  chainName: string,
  retryTimeMs = 10 * 1000
): Promise<IErc721Contracts> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.ERC721])
  );

  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(
        ethNetworkUrl,
        SupportedNetwork.ERC721
      );
      log.info(`Connection to ${ethNetworkUrl} successful!`);

      const tokenContracts = tokenAddresses.map((o) => {
        return {
          contract: ERC721Factory.connect(o, provider),
          contractAddress: o,
        };
      });

      const deployResults: IErc721Contracts = { provider, tokens: [] };

      for (const { contract, contractAddress } of tokenContracts) {
        try {
          await contract.deployed();
          deployResults.tokens.push({
            contract,
            contractAddress,
          });
        } catch (err) {
          log.error(
            `Error loading token ${contract.address} (${contractAddress}): ${err.message}`
          );
        }
      }
      return deployResults;
    } catch (err) {
      log.error(`Erc721 at ${ethNetworkUrl} failure: ${err.message}`);
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
    }
  }

  throw new Error(
    `[${SupportedNetwork.ERC721}]: Failed to start the ERC721 listener for ${tokenAddresses} at ${ethNetworkUrl}`
  );
}

/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export const subscribeEvents: SubscribeFunc<
  IErc721Contracts,
  RawEvent,
  IErc721SubscribeOptions
> = async (options) => {
  const { chain, api, handlers, verbose } = options;
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.ERC721])
  );
  // helper function that sends an event through event handlers
  const handleEventFn = async (
    event: CWEvent<IEventData>,
    tokenName?: string
  ): Promise<void> => {
    event.chainName = (tokenName as never) || chain;
    event.received = Date.now();
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
  const processEventFn = async (
    event: RawEvent,
    tokenName?: string
  ): Promise<void> => {
    // retrieve events from block
    const cwEvents: CWEvent<IEventData>[] = await processor.process(event);

    // process events in sequence
    for (const cwEvent of cwEvents) {
      await handleEventFn(cwEvent, tokenName);
    }
  };

  const subscriber = new Subscriber(api, chain, verbose);

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch skipped events

  try {
    log.info(`Subscribing to ERC721 contracts ${chain}...`);
    await subscriber.subscribe(processEventFn);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
};
