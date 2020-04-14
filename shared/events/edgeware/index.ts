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
        const processor = new Processor();
        const processBlockFn = async (block: SubstrateBlock) => {
          const events: SubstrateEvent[] = processor.process(block);
          events.map((event) => handler.handle(event));
        };

        const pollMissedBlocksFn = async () => {
          console.log('Detected offline time, polling missed blocks...');
          // determine how large of a reconnect we dealt with
          let offlineRange: IDisconnectedRange;

          // first attempt a provided range finding method
          if (discoverReconnectRange) {
            offlineRange = await discoverReconnectRange();
          }

          // fall back to default range algorithm: take last cached block in processor
          if (!offlineRange || !offlineRange.startBlock) {
            const lastBlockNumber = processor.lastBlockNumber;
            offlineRange = { startBlock: lastBlockNumber };
          }

          // if we haven't seen any blocks, don't attempt recovery
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
        pollMissedBlocksFn();

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
