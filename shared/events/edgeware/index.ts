import { WsProvider, ApiPromise } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';

import * as edgewareDefinitions from 'edgeware-node-types/dist/definitions';

import Subscriber from './subscriber';
import Poller from './poller';
import Processor from './processor';
import { SubstrateBlock } from './types';
import { IEventHandler, IBlockSubscriber, IDisconnectedRange, CWEvent } from '../interfaces';

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export function createApi(provider: WsProvider): ApiPromise {
  const registry = new TypeRegistry();
  const edgewareTypes = Object.values(edgewareDefinitions)
    .map((v) => v.default)
    .reduce((res, { types }): object => ({ ...res, ...types }), {});
  return new ApiPromise({
    provider,
    types: {
      ...edgewareTypes,
      'voting::VoteType': 'VoteType',
      'voting::TallyType': 'TallyType',
      // chain-specific overrides
      Address: 'GenericAddress',
      Keys: 'SessionKeys4',
      StakingLedger: 'StakingLedgerTo223',
      Votes: 'VotesTo230',
      ReferendumInfo: 'ReferendumInfoTo239',
      Weight: 'u32',
    },
    registry
  });
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
export default function (
  url = 'ws://localhost:9944',
  handlers: IEventHandler[],
  skipCatchup: boolean,
  discoverReconnectRange?: () => Promise<IDisconnectedRange>,
): Promise<IBlockSubscriber<any, SubstrateBlock>> {
  const provider = new WsProvider(url);
  return new Promise((resolve) => {
    let subscriber;
    provider.on('connected', () => {
      if (subscriber) {
        resolve(subscriber);
        return;
      }
      createApi(provider).isReady.then((api) => {
        subscriber = new Subscriber(api);
        const poller = new Poller(api);
        const processor = new Processor(api);
        const processBlockFn = async (block: SubstrateBlock) => {
          // retrieve events from block
          const events: CWEvent[] = await processor.process(block);

          // send all events through event-handlers in sequence
          await Promise.all(events.map(async (event) => {
            let prevResult = null;
            /* eslint-disable-next-line no-restricted-syntax */
            for (const handler of handlers) {
              try {
                // pass result of last handler into next one (chaining db events)
                /* eslint-disable-next-line no-await-in-loop */
                prevResult = await handler.handle(event, prevResult);
              } catch (err) {
                console.error(`Event handle failure: ${JSON.stringify(err, null, 4)}`);
                break;
              }
            }
          }));
        };

        const pollMissedBlocksFn = async () => {
          console.log('Detected offline time, polling missed blocks...');
          // grab the cached block immediately to avoid a new block appearing before the
          // server can do its thing...
          const lastBlockNumber = processor.lastBlockNumber;

          // determine how large of a reconnect we dealt with
          let offlineRange: IDisconnectedRange;

          // first, attempt the provided range finding method if it exists
          // (this should fetch the block of the last server event from database)
          if (discoverReconnectRange) {
            offlineRange = await discoverReconnectRange();
          }

          // compare with default range algorithm: take last cached block in processor
          // if it exists, and is more recent than the provided algorithm
          // (note that on first run, we wont have a cached block/this wont do anything)
          if (lastBlockNumber
              && (!offlineRange || !offlineRange.startBlock || offlineRange.startBlock < lastBlockNumber)) {
            offlineRange = { startBlock: lastBlockNumber };
          }

          // if we can't figure out when the last block we saw was, do nothing
          // (i.e. don't try and fetch all events from block 0 onward)
          if (!offlineRange || !offlineRange.startBlock) {
            console.error('Unable to determine offline time range.');
            return;
          }

          // poll the missed blocks for events
          try {
            const blocks = await poller.poll(offlineRange);
            await Promise.all(blocks.map(processBlockFn));
          } catch (e) {
            console.error(`Block polling failed after disconnect at block ${offlineRange.startBlock}`);
          }
        };

        if (!skipCatchup) {
          pollMissedBlocksFn();
        } else {
          console.log('Skipping event catchup on startup!');
        }

        try {
          console.log(`Subscribing to Edgeware at ${url}...`);
          subscriber.subscribe(processBlockFn);

          // handle reconnects with poller
          api.on('connected', pollMissedBlocksFn);
        } catch (e) {
          console.error(`Subscription error: ${JSON.stringify(e, null, 2)}`);
        }

        resolve(subscriber);
      });
    });
  });
}
