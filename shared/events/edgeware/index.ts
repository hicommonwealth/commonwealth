import { WsProvider, ApiPromise } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';

import * as edgewareDefinitions from 'edgeware-node-types/dist/definitions';

import Subscriber from './subscriber';
import Poller from './poller';
import Processor from './processor';
import { SubstrateBlock } from './types';
import { IEventHandler, IBlockSubscriber, IDisconnectedRange, CWEvent } from '../interfaces';
import fetchFromStorage from './storageFetcher';

import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export function createApi(provider: WsProvider, isEdgeware: boolean): ApiPromise {
  const registry = new TypeRegistry();
  if (isEdgeware) {
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
  } else {
    return new ApiPromise({ provider, registry });
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
export default async function (
  chain: string,
  url = 'ws://localhost:9944',
  handlers: IEventHandler[],
  skipCatchup: boolean,
  discoverReconnectRange?: () => Promise<IDisconnectedRange>,
  performMigration?: boolean,
): Promise<IBlockSubscriber<any, SubstrateBlock>> {
  const provider = new WsProvider(url, 10 * 1000);
  let unsubscribe: () => void;
  await new Promise((resolve) => {
    unsubscribe = provider.on('connected', () => resolve());
  });
  if (unsubscribe) unsubscribe();

  const api = await createApi(provider, chain.startsWith('edgeware')).isReady;

  // helper function that sends an event through event handlers
  const handleEventFn = async (event: CWEvent) => {
    let prevResult = null;
    /* eslint-disable-next-line no-restricted-syntax */
    for (const handler of handlers) {
      try {
        // pass result of last handler into next one (chaining db events)
        /* eslint-disable-next-line no-await-in-loop */
        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        log.error(`Event handle failure: ${JSON.stringify(err, null, 4)}`);
        break;
      }
    }
  };

  // helper function that sends a block through the event processor and
  // into the event handlers
  const processor = new Processor(api);
  const processBlockFn = async (block: SubstrateBlock) => {
    // retrieve events from block
    const events: CWEvent[] = await processor.process(block);

    // send all events through event-handlers in sequence
    await Promise.all(events.map((event) => handleEventFn(event)));
  };

  // special case to perform a migration on first run
  // returns early, does not initialize the subscription
  if (performMigration) {
    const version = await api.rpc.state.getRuntimeVersion();
    log.info(`Starting event migration for ${version.specName}:${version.specVersion} at ${url}.`);
    const events = await fetchFromStorage(api);
    await Promise.all(events.map((event) => handleEventFn(event)));
    return;
  }

  const subscriber = new Subscriber(api);
  const poller = new Poller(api);

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch events from skipped blocks
  const pollMissedBlocksFn = async () => {
    log.info('Detected offline time, polling missed blocks...');
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
      log.warn('Unable to determine offline time range.');
      return;
    }

    // poll the missed blocks for events
    try {
      const blocks = await poller.poll(offlineRange);
      await Promise.all(blocks.map(processBlockFn));
    } catch (e) {
      log.error(`Block polling failed after disconnect at block ${offlineRange.startBlock}`);
    }
  };

  if (!skipCatchup) {
    pollMissedBlocksFn();
  } else {
    log.info('Skipping event catchup on startup!');
  }

  try {
    log.info(`Subscribing to Substrate endpoint at ${url}...`);
    subscriber.subscribe(processBlockFn);

    // handle reconnects with poller
    api.on('connected', pollMissedBlocksFn);
  } catch (e) {
    log.error(`Subscription error: ${JSON.stringify(e, null, 2)}`);
  }

  return subscriber;
}
