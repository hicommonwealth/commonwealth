import moment from 'moment';
import { Client } from 'pg';

import BN from 'bn.js';
import JobRunner from 'common-common/src/cacheJobRunner';
import { factory, formatFilename } from 'common-common/src/logging';

import {
  BalanceProvider,
  BalanceProviderResp,
  ChainNodeResp,
  ICache,
  IChainNode,
  ITokenBalanceCache,
  TokenBalanceResp,
} from './types';
import { default as BalanceProviders } from './providers';

const log = factory.getLogger(formatFilename(__filename));

const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

function getKey(...args: string[]) {
  return args.join('-');
}

export default class TokenBalanceCache extends JobRunner<ICache> implements ITokenBalanceCache {
  private _nodes: { [id: number]: IChainNode } = {};
  private _providers: { [name: string]: BalanceProvider } = {};
  constructor(
    noBalancePruneTimeS: number = 5 * 60,
    private readonly _hasBalancePruneTimeS: number = 24 * 60 * 60,
  ) {
    super({}, noBalancePruneTimeS);
    for (const provider of BalanceProviders) {
      this._providers[provider.name] = provider;
    }
  }

  public async getChainNodes(): Promise<ChainNodeResp[]> {
    return Object.values(this._nodes)
      .map(({ id, name, description, chain_base, ss58, bech32 }) => ({
        id, name, description, base: chain_base, prefix: bech32 || ss58?.toString()
      }));
  }

  public async getBalanceProviders(nodeId: number): Promise<BalanceProviderResp[]> {
    const node = this._nodes[nodeId];
    if (!node) throw new Error('Could not find node');
    let provider: BalanceProvider;
    if (node.chain_base === 'terra') {
      provider = this._providers['terra'];
    } else if (node.chain_base === 'ronin') {
      provider = this._providers['ronin'];
    } else if (node.chain_base === 'cosmos') {
      provider = this._providers['cosmos'];
    } else if (node.chain_base === 'ethereum') {
      provider = this._providers['eth-token'];
    } else if (node.chain_base === 'solana') {
      provider = this._providers['spl-token'];
    } else {
      throw new Error('unknown chain base');
    }
    return [{
      bp: provider.name,
      opts: provider.opts,
    }];
  }

  public async getBalances(
    nodeId: number,
    addresses: string[],
    balanceProvider: string,
    opts: Record<string, string>,
  ): Promise<TokenBalanceResp> {
    const node = this._nodes[nodeId];
    if (!node) {
      throw new Error('unknown node id');
    }
    const [{ bp }] = await this.getBalanceProviders(nodeId);
    if (bp !== balanceProvider) {
      throw new Error('balance provider does not match node');
    }
    const providerObj = this._providers[balanceProvider];

    const getBalance = async (address: string): Promise<string> => {
      const cacheKey = getKey(nodeId.toString(), address, balanceProvider, JSON.stringify(opts));
      const result = await this.access((async (c: ICache): Promise<string | undefined> => {
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
      const balance = await providerObj.getBalance(node, address, opts);

      // write fetched balance back to cache
      await this.access((async (c: ICache) => {
        c[cacheKey] = { balance, fetchedAt };
      }));
      return balance;
    };

    const results = {
      balances: {},
      errors: {},
    }
    for (const address of addresses) {
      try {
        const balance = await getBalance(address);
        results.balances[address] = balance;
      } catch (e) {
        results.errors[address] = e.message;
      }
    }
    return results;
  }

  public async start() {
    // fetch node id map from database at startup
    const db = new Client({
      connectionString: DATABASE_URI,
      ssl: process.env.NODE_ENV !== 'production' ? false : {
        rejectUnauthorized: false,
      },
    });
    await db.connect();
    const nodeQuery = await db.query<IChainNode>(`SELECT * FROM "ChainNodes";`);
    const nodeArray = nodeQuery.rows;
    for (const n of nodeArray) {
      this._nodes[n.id] = n;
    }
    await db.end();

    // kick off job
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

  // prune cache job
  protected async _job(cache: ICache): Promise<void> {
    for (const key of Object.keys(cache)) {
      if (new BN(cache[key].balance).eqn(0)) {
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
