import { factory, formatFilename } from 'common-common/src/logging';
import { RedisCache } from 'common-common/src/redisCache';
import { RedisNamespaces } from 'common-common/src/types';
import type { DB } from '../models';
import { AddressAttributes } from '../models/address';
import {
  ActivityRow,
  getActivityFeed,
  type GlobalActivity,
} from './activityQuery';
import { rollbar } from './rollbar';

type GlobalActivityJson = Array<
  Omit<ActivityRow, 'commenters'> & {
    commenters: Array<{ id: number; Addresses: AddressAttributes[] }>;
  }
>;

const log = factory.getLogger(formatFilename(__filename));

export default class GlobalActivityCache {
  private _cacheKey = 'global_activity';

  constructor(
    private _models: DB,
    private _redisCache: RedisCache,
    private _cacheTTL: number = 60 * 5,
  ) {}

  public async start() {
    await this.refreshGlobalActivity();
    setInterval(this.refreshGlobalActivity.bind(this), this._cacheTTL);
  }

  public async getGlobalActivity(): Promise<
    GlobalActivityJson | GlobalActivity
  > {
    const activity = await this._redisCache.getKey(
      RedisNamespaces.Activity_Cache,
      this._cacheKey,
    );

    if (!activity) {
      const msg = 'Failed to fetch global activity from Redis';
      log.error(msg);
      rollbar.error(msg);
      return await getActivityFeed(this._models);
    }
    return JSON.parse(activity);
  }

  public async refreshGlobalActivity(): Promise<void> {
    try {
      const activity = await getActivityFeed(this._models);
      const result = await this._redisCache.setKey(
        RedisNamespaces.Activity_Cache,
        this._cacheKey,
        JSON.stringify(activity),
      );
      if (!result) {
        const msg = 'Failed to save global activity in Redis';
        log.error(msg);
        rollbar.error(msg);
      }
    } catch (e) {
      const msg = 'Failed to refresh the global cache';
      log.error(msg, e);
      rollbar.error(msg, e);
    }
  }
}
