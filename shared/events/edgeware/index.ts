import Subscriber from './subscriber';
import Poller from './poller';
import EventHandler from './eventHandler';
import Processor from './processor';
import { constructSubstrateApiPromise } from './util';
import { SubstrateBlock, SubstrateEvent } from './types';

export default async function (url = 'ws://localhost:9944') {
  // TODO: make this adjustable
  const api = await constructSubstrateApiPromise(url);
  const subscriber = new Subscriber(api);
  const poller = new Poller(api);
  const processor = new Processor();
  const handler = new EventHandler();

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
}
