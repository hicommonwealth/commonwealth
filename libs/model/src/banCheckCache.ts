import { JobRunner } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';

export const BanErrors = {
  NoAddress: 'Address not found',
  Banned: 'User owns a banned address',
};

type CacheT = { [communityAddressKey: string]: number };

// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.
export class BanCache extends JobRunner<CacheT> {
  private static _instance: BanCache;

  static getInstance(
    models: DB,
    ttlS?: number,
    prunningJobsTimeS?: number,
  ): BanCache {
    if (!BanCache._instance)
      BanCache._instance = new BanCache(models, ttlS, prunningJobsTimeS);
    return BanCache._instance;
  }

  constructor(
    private _models: DB,
    private _ttlS: number = 60 * 15, // 10 minutes
    _pruningJobTimeS: number = 60 * 5, // 5 minutes
  ) {
    super({}, _pruningJobTimeS);
    this.start();
  }

  public async checkBan(params: {
    communityId?: string;
    address: string;
  }): Promise<[boolean, string?]> {
    const { address, communityId } = params;
    const cacheKey = `${communityId}-${address}`;

    // first, check cache for existing ban
    const isCachedBan = await this.access(async (c: CacheT) => {
      const bannedAt = c[cacheKey];
      if (!bannedAt) {
        return false;
      }
      const now = Date.now() / 1000;
      const oldestPermittedTime = now - this._ttlS;
      if (bannedAt > oldestPermittedTime) {
        return true;
      } else {
        delete c[cacheKey];
        return false;
      }
    });
    if (isCachedBan) {
      return [false, BanErrors.Banned];
    }

    const ban = await this._models.Ban.findOne({
      where: {
        community_id: communityId,
        address,
      },
    });

    // insert into cache if ban found
    if (ban) {
      await this.access(async (c) => {
        c[cacheKey] = Date.now() / 1000;
      });
      return [false, BanErrors.Banned];
    }
    return [true];
  }

  // prunes all expired cache entries based on initialized time-to-live
  protected async _job(c: CacheT): Promise<void> {
    const oldestPermittedTime = Date.now() / 1000 - this._ttlS;
    for (const key of Object.keys(c)) {
      const banCheckDate = c[key];
      if (banCheckDate < oldestPermittedTime) {
        delete c[key];
      }
    }
  }
}
