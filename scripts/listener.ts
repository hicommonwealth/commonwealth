import subscribeMolochEvents, { createMolochApi } from '../src/moloch/index';
import subscribeSubstrateEvents, { createSubstrateApi, createSubstrateProvider } from '../src/substrate/index';
import { IEventHandler, CWEvent } from '../src/interfaces';

const chain = process.env.NODE_CHAIN || 'edgeware';
const network = process.env.ETH_NETWORK || 'ws://mainnet1.edgewa.re:9944';
const contractAddress = '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7';

const DEV = process.env.NODE_ENV !== 'production';
class StandaloneEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    // just prints the event
    if (DEV) console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

const skipCatchup = false;

createSubstrateProvider(network).then((provider) => {
  return createSubstrateApi(provider, true).isReady;
}).then((api) => {
  subscribeSubstrateEvents({
    chain,
    api,
    handlers: [ new StandaloneEventHandler() ],
    skipCatchup,
  });
})
