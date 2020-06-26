import subscribeMolochEvents, { createMolochApi } from '../src/moloch/index';
import { IEventHandler, CWEvent } from '../src/interfaces';

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

createMolochApi(network, 1, contractAddress).then((api) => {
  subscribeMolochEvents({
    chain,
    api,
    contractVersion: 1,
    handlers: [ new StandaloneMolochEventHandler() ],
    skipCatchup,
  });
});
