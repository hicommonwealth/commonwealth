import JobRunner from 'common-common/src/cacheJobRunner';
import { factory, formatFilename } from 'common-common/src/logging';

import moment from 'moment';

const log = factory.getLogger(formatFilename(__filename));

// map of rules-addresses to pass (fail always recheck)
interface CacheT {
  [cacheKey: string]: moment.Moment;
}

export default class RuleCache extends JobRunner<CacheT> {
  constructor(
    private readonly _pruneTime: number = 5 * 60 // 5 minutes
  ) {
    super({}, _pruneTime);
  }

  public async start() {
    super.start();
    log.info(`Started Rule Cache.`);
  }

  public async reset() {
    super.close();
    await this.access(async (cache) => {
      for (const key of Object.keys(cache)) {
        delete cache[key];
      }
    });
    return this.start();
  }

  // returns true on pass, false on fail/not-found
  public async check(ruleId: number, address: string): Promise<boolean> {
    const key = `${ruleId}-${address}`;
    const fetchedAt = moment();
    return this.access(async (c: CacheT): Promise<boolean> => {
      if (c[key]) {
        c[key] = fetchedAt;
        return true;
      } else {
        return false;
      }
    });
  }

  public async add(ruleId: number, address: string): Promise<void> {
    const key = `${ruleId}-${address}`;
    const fetchedAt = moment();
    await this.access(async (c: CacheT) => {
      c[key] = fetchedAt;
    });
  }

  // prune cache job
  protected async _job(cache: CacheT): Promise<void> {
    for (const key of Object.keys(cache)) {
      // 24 hour lifetime if token balance exists
      const cutoff = moment().subtract(this._pruneTime, 'seconds');
      const fetchedAt = cache[key];
      if (fetchedAt.isSameOrBefore(cutoff)) {
        delete cache[key];
      }
    }
  }
}
