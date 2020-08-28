import { SubstrateEvents } from '@commonwealth/chain-events';
import IdentityEventHandler from '../eventHandlers/identity';
import JobRunner from './cacheJobRunner';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

// list of identities to fetch
type CacheT = { [chain: string]: string[] }

export default class IdentityFetchCache extends JobRunner<CacheT> {
  private _fetchers: { [chain: string]: SubstrateEvents.StorageFetcher } = {};
  private _models;

  constructor(_jobTimeS: number) {
    super({}, _jobTimeS);
  }

  public start(models, fetchers: { [chain: string]: SubstrateEvents.StorageFetcher }) {
    this._models = models;
    this._fetchers = fetchers;
    this.access(async (c) => {
      // write empty arrays for all available chains
      Object.keys(fetchers).reduce((res, chain) => Object.assign(c, { [chain]: [] }), c);
    });

    // kick off job
    super.start();
  }

  public async add(chain: string, address: string) {
    if (this._fetchers[chain]) {
      await this.access(async (c) => {
        c[chain].push(address);
      });
    }
  }

  protected async _job(c: CacheT): Promise<void> {
    // for each chain, clear cache and fetch all events
    // TODO: part of this can be removed from the job proper, the only atomic piece needed
    //   is copying and clearing the address list for each chain
    await Promise.all(Object.keys(c).map(async (chain) => {
      try {
        // fetch all identities for the chain
        const identityEvents = await this._fetchers[chain].fetchIdentities(c[chain]);

        // write the found identities back to db using the event handler
        log.info(`Writing identities for chain ${chain} back to db...`);
        const handler = new IdentityEventHandler(this._models, chain);
        await Promise.all(identityEvents.map((e) => handler.handle(e, null)));

        // clear the cache for this chain
        c[chain].splice(0, c[chain].length);
        log.debug(`Succeeded in updating identities for ${chain}.`);
      } catch (e) {
        log.error(`Failed to update identities for ${chain}: ${e.message}!`);
      }
    }));
  }
}
