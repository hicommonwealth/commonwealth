import subscribeMolochEvents from './shared/events/moloch/index';
import { IEventHandler, CWEvent } from './shared/events/interfaces';

const chain = process.env.NODE_CHAIN || 'moloch-local';
const network = process.env.ETH_NETWORK || 'ws://localhost:9545';
const contractAddress = '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7';

const DEV = process.env.NODE_ENV !== 'production';
class StandaloneMolochEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    // just prints the event
    if (DEV) console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

const skipCatchup = false;

subscribeMolochEvents(chain, network, 1, contractAddress, [ new StandaloneMolochEventHandler() ]);
