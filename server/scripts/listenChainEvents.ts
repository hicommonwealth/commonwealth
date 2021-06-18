import { chainSupportedBy, SubstrateEvents, SubstrateTypes } from '@commonwealth/chain-events';
import IdentityFetchCache from '../util/identityFetchCache';
import setupChainEventListeners from './setupChainEventListeners';
import models from '../database';

async function main() {
  // CLI parameters used to configure specific tasks
  const SKIP_EVENT_CATCHUP = process.env.SKIP_EVENT_CATCHUP === 'true';
  const CHAIN_EVENTS = process.env.CHAIN_EVENTS;
  const RUN_AS_LISTENER = process.env.RUN_AS_LISTENER === 'true';

  const identityFetchCache = new IdentityFetchCache(10 * 60);
  const listenChainEvents = async () => {
    try {
      // configure chain list from events
      let chains: string[] | 'all' | 'none';
      if (CHAIN_EVENTS === 'none' || CHAIN_EVENTS === 'all') {
        chains = CHAIN_EVENTS;
      } else if (CHAIN_EVENTS) {
        chains = CHAIN_EVENTS.split(',');
      }
      chains = ['dydx-ropsten'];
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`Pre setup event listeners uses approximately ${used} MB`);

      const subscribers = await setupChainEventListeners(models, null, chains, SKIP_EVENT_CATCHUP);
      // construct storageFetchers needed for the identity cache
      const fetchers = {};
      for (const [ chain, subscriber ] of Object.entries(subscribers)) {
        if (chainSupportedBy(chain, SubstrateTypes.EventChains)) {
          fetchers[chain] = new SubstrateEvents.StorageFetcher(subscriber.api);
        }
      }
      await identityFetchCache.start(models, fetchers);
      return 0;
    } catch (e) {
      console.error(`Chain event listener setup failed: ${e.message}`);
      return 1;
    }
  };

  if (RUN_AS_LISTENER) {
    // hack to keep process running indefinitely
    process.stdin.resume();
    listenChainEvents().then((retcode) => {
      if (retcode) {
        process.exit(retcode);
      }
      // if recode === 0, continue indefinitely
    });
  } else {
    console.log('Not running as listener, exiting.');
    process.exit(0);
  }
}

main();
