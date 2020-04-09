import Subscriber from './subscriber';
import Poller from './poller';
import Processor from './processor';
import { constructSubstrateApiPromise } from './util';
import { SubstrateBlock, SubstrateEvent } from './types';
import { IEventHandler, IBlockSubscriber } from '../interfaces';

export default async function (
  url = 'ws://localhost:9944',
  handler: IEventHandler<SubstrateEvent>
): Promise<IBlockSubscriber<any, SubstrateBlock>> {
  // TODO: make this adjustable
  const api = await constructSubstrateApiPromise(url);
  const subscriber = new Subscriber(api);
  const poller = new Poller(api);
  const processor = new Processor();

  try {
    console.log(`Subscribing to Edgeware at ${url}...`);
    subscriber.subscribe(
      async (block: SubstrateBlock) => {
        const events: SubstrateEvent[] = processor.process(block);
        events.map((event) => handler.handle(event));
      }
    );
  } catch (e) {
    console.error(`Subscription error: ${JSON.stringify(e, null, 2)}`);
  }
  return subscriber;
}
