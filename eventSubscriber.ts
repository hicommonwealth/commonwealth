import subscribeEdgewareEvents from './shared/events/edgeware/index';
import { IEventHandler, CWEvent } from './shared/events/interfaces';

const url = process.env.NODE_URL || undefined;

class StandaloneSubstrateEventHandler extends IEventHandler {
  public async handle(event: CWEvent) {
    // just prints the event
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

const skipCatchup = false;
subscribeEdgewareEvents(url, new StandaloneSubstrateEventHandler(), skipCatchup);
