import { JobRunner } from '@hicommonwealth/core';
import { config, type DB } from '@hicommonwealth/model';

export const BanErrors = {
  NoAddress: 'Address not found',
  Banned: 'User owns a banned address',
};

type CacheT = { [communityAddressKey: string]: number };

interface BanChecker {
  checkBan(params: {
    communityId?: string;
    address: string;
  }): Promise<[boolean, string?]>;
}

export class BanCache {
  private static _instance: BanChecker;
  static getInstance(
    models: DB,
    ttlS?: number,
    prunningJobsTimeS?: number,
  ): BanChecker {
    if (config.NODE_ENV === 'test') return MockedChecker;
    if (!BanCache._instance)
      BanCache._instance = new DbChecker(models, ttlS, prunningJobsTimeS);
    return BanCache._instance;
  }
}

const MockedChecker: BanChecker = {
  checkBan({ address }) {
    if (address === '0xbanned')
      return Promise.resolve([false, BanErrors.Banned]);
    return Promise.resolve([true, undefined]);
  },
};

// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.
class DbChecker extends JobRunner<CacheT> implements BanChecker {
  constructor(
    private _models: DB,
    private _ttlS: number = 60 * 15, // 10 minutes
    _pruningJobTimeS: number = 60 * 5, // 5 minutes
  ) {
    super({}, _pruningJobTimeS);
    this.start();
  }

  public async checkBan({
    communityId,
    address,
  }: {
    communityId?: string;
    address: string;
  }): Promise<[boolean, string?]> {
    const cacheKey = `${communityId}-${address}`;

    // first, check cache for existing ban
    const isCachedBan = await this.access((c: CacheT) => {
      const bannedAt = c[cacheKey];
      if (!bannedAt) return Promise.resolve(false);
      const now = Date.now() / 1000;
      const oldestPermittedTime = now - this._ttlS;
      if (bannedAt > oldestPermittedTime) return Promise.resolve(true);
      delete c[cacheKey];
      return Promise.resolve(false);
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
      await this.access((c) => {
        c[cacheKey] = Date.now() / 1000;
        return Promise.resolve();
      });
      return [false, BanErrors.Banned];
    }
    return [true, undefined];
  }

  // prunes all expired cache entries based on initialized time-to-live
  protected _job(c: CacheT): Promise<void> {
    const oldestPermittedTime = Date.now() / 1000 - this._ttlS;
    for (const key of Object.keys(c)) {
      const banCheckDate = c[key];
      if (banCheckDate < oldestPermittedTime) {
        delete c[key];
      }
    }
    return Promise.resolve();
  }
}
