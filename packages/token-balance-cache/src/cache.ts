import moment from 'moment';

import BN from 'bn.js';
import { factory, formatFilename } from 'common-common/src/logging';
import JobRunner from 'common-common/src/cacheJobRunner';

import Providers from './providers';
import { ChainNodeT } from './types';
import fetchNodes from './database';

const log = factory.getLogger(formatFilename(__filename));

// map of addresses to balances
interface CacheT {
  [cacheKey: string]: {
    balance: BN,
    fetchedAt: moment.Moment;
  }
}

export default class TokenBalanceCache extends JobRunner<CacheT> {
  private _nodes: { [id: number]: ChainNodeT } = {};
  public get nodes() {
    const nodeArray = Object.values(this._nodes);
    return nodeArray.map(({ id, name, description }) => ({ id, name, description }));
  }

  constructor(
    noBalancePruneTimeS: number = 5 * 60,
    private readonly _hasBalancePruneTimeS: number = 24 * 60 * 60,
  ) {
    super({}, noBalancePruneTimeS);
  }

  public async start() {
    this._nodes = await fetchNodes();
    super.start();
    log.info(`Started Token Balance Cache.`);
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

  // query a user's balance on a given token contract and save in cache
  public async getBalance(
    nodeId: number,
    address: string,
    providerName: string,
    opts: Record<string, unknown>,
  ): Promise<BN> {
    const node = this._nodes[nodeId];
    if (!node) {
      throw new Error('Node not found!');
    }

    const provider = Providers[providerName];
    if (!provider) {
      throw new Error('Provider not found!');
    }

    // check the cache for the token balance
    const cacheKey = provider.getCacheKey(node, address, opts);
    const result = await this.access((async (c: CacheT): Promise<BN | undefined> => {
      if (c[cacheKey]) {
        return c[cacheKey].balance;
      } else {
        return undefined;
      }
    }));
    if (result !== undefined) return result;

    // fetch balance if not found in cache
    const fetchedAt = moment();

    // will throw on invalid chain / other error
    const balance = await provider.getBalance(node, address, opts);

    // write fetched balance back to cache
    await this.access((async (c: CacheT) => {
      c[cacheKey] = { balance, fetchedAt };
    }));
    return balance;
  }

  // prune cache job
  protected async _job(cache: CacheT): Promise<void> {
    for (const key of Object.keys(cache)) {
      if (cache[key].balance.eqn(0)) {
        // 5 minute lifetime (i.e. one job run) if no token balance
        delete cache[key];
      } else {
        // 24 hour lifetime if token balance exists
        const cutoff = moment().subtract(this._hasBalancePruneTimeS, 'seconds');
        const fetchedAt = cache[key].fetchedAt;
        if (fetchedAt.isSameOrBefore(cutoff)) {
          delete cache[key];
        }
      }
    }
  }
}
