import { Op } from 'sequelize';
import JobRunner from './cacheJobRunner';
import { DB } from '../database';
import { factory, formatFilename } from '../../shared/logging';
import { ChainInstance } from '../models/chain';

const log = factory.getLogger(formatFilename(__filename));

// map of snapshot spaces and associated chains
// ALT: chainId could be an Array<ChainInstance> if we want to preserve it
type CacheT = { [snapshotCache: string] : Set<string> };

export default class SnapshotSpaceCache extends JobRunner<CacheT> {
  private _models: DB;
    constructor(
      models: DB,
      // Update the cache every hour
      jobTimeS = 60 * 60,
      bitch: CacheT = { snapshotCache : new Set<string>() }
    ) {
      super(bitch, jobTimeS);
      this._models = models;
    }

  public async start() {
    super.start();
    log.info(`Started Snapshot Space Cache.`);
  }

  public async check(snapshot : string): Promise<boolean> {
    const result = await this.access((async (c: CacheT): Promise<boolean | undefined> => {
      // Just in case cache is empty
      if (!c.snapshotCache.size) {
        // Call _job to populate cache
        await this._job(c);
      }

      // Check if the snapshot space is in the cache
      return c.snapshotCache.has(snapshot);
    }));

    return result;
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
      attributes: ['snapshot'],
      where: {
        snapshot: {
          [Op.ne]: []
        }
      },
    });

    // Get all snapshot spaces out of the ChainInstance array and add it to the snapshotCache
    allSnapshots.forEach((chainInstance: ChainInstance) => {
      chainInstance.snapshot.forEach((snapshotSpace: string) => {
        c.snapshotCache.add(snapshotSpace);
      });
    });

    return log.info(`Snapshot Space Cache Job Complete.`);
  }
}