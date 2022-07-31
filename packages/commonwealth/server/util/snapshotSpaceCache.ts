import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import JobRunner from 'common-common/src/cacheJobRunner';
import { DB } from '../database';
import { ChainInstance } from '../models/chain';

const log = factory.getLogger(formatFilename(__filename));

// Map of snapshot spaces and associated chains
// ALT: chainId could be an Array<ChainInstance> if we want to preserve it
type CacheT = { [snapshotCache: string] : Map<string, Array<string>>};

export default class SnapshotSpaceCache extends JobRunner<CacheT> {
  private _models: DB;
  constructor(
    models: DB,
    // Update the cache every hour
    jobTimeS = 60 * 60,
    cache: CacheT = { snapshotCache : new Map<string, Array<string>>() }
  ) {
    super(cache, jobTimeS);
    this._models = models;
  }

  public async start() {
    super.start();
    log.info(`Started Snapshot Space Cache.`);
  }

  // This will check if the given snapshot space is in the cache and will return
  // either an array of the chains that subscribe to that space or an empty array
  public async checkChainsToNotify(snapshot : string): Promise<string[]> {
    const chainsToNotify = await this.access((async (c: CacheT): Promise<string[] | undefined> => {
      const subscribedChains : string[] = [];

      // In case cache is empty
      if (!c.snapshotCache.size) {
        // Call _job to populate cache
        await this._job(c);
      }

      // Check if the snapshot space is in the cache
      c.snapshotCache.forEach((snapshotArray, spaceName) => {
        if (snapshotArray.includes(snapshot)) {
          subscribedChains.push(spaceName);
        }
      });
      return subscribedChains;
    }));

    return chainsToNotify;
  }

  protected async _job(c: CacheT): Promise<void> {
    // If the cache is empty
    if (!c.snapshotCache.size) {
      log.info(`Populating Snapshot Space Cache.`);
    } else {
      log.info(`Updating Snapshot Space Cache.`);
    }
    // NOTE: This sucks and is not really efficient but given how the DB
    // and CacheJobRunner are set up, this seems to be the best option
    //    - populating and updating the cache are the same because
    //      any sort of comparison between the cache and the DB to
    //      filter out spaces already in the cache would involve
    //      additional in-depth querying of the DB which defeats the
    //      purpose of the cache
    //    - populating the cache has to happen here and not in the
    //      check method because cacheJobRunner makes the _job method
    //      run before all others
    const allSnapshots = await this._models.Chain.findAll({
      attributes: ['id', 'snapshot'],
      where: {
        snapshot: {
          [Op.ne]: []
        }
      },
    });

    // Get chains and the snapshot spaces they subscribe to out of the ChainInstance array
    // and add it to the snapshotCache
    allSnapshots.forEach((chainInstance: ChainInstance) => {
      c.snapshotCache.set(chainInstance.id, chainInstance.snapshot);
    });

    // Print all the snapshot spaces in the cache for debugging
    // console.log(c.snapshotCache);
    return log.info(`Snapshot Space Cache Job Complete.`);
  }
}