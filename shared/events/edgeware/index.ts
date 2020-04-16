import { WsProvider, ApiPromise } from '@polkadot/api';

import Subscriber from './subscriber';
import Poller from './poller';
import Processor from './processor';
import { createApi } from './util';
import { SubstrateBlock, SubstrateEvent } from './types';
import { IEventHandler, IBlockSubscriber, IDisconnectedRange } from '../interfaces';

export default function (
  url = 'ws://localhost:9944',
  handler: IEventHandler<SubstrateEvent>,
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
          const events: SubstrateEvent[] = await processor.process(block);
          events.map((event) => handler.handle(event));
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
          // TODO: get real failure handling esp for disconnections
          console.error(`Subscription error: ${JSON.stringify(e, null, 2)}`);
        }

        resolve(subscriber);
      });
    });
  });
}
