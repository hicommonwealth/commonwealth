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

async function queryChainNodesFromDB(lastQueryUnixTime: number): Promise<IChainNode[]> {
  const query = `SELECT * FROM "ChainNodes" WHERE updated_at >= to_timestamp (${lastQueryUnixTime})::date;`
  
  const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

  const db = new Client({
    connectionString: DATABASE_URI,
    ssl: process.env.NODE_ENV !== 'production' ? false : {
      rejectUnauthorized: false,
    },
  });
  await db.connect();
  const nodeQuery = await db.query<IChainNode>(query);
  const nodeArray = nodeQuery.rows;
  await db.end();
  return nodeArray;
}

// TODO: have JobRunner/cache as include rather than extends, for unit testing,
//    then rename to TokenBalanceController / TokenBalanceService
export class TokenBalanceCache extends JobRunner<ICache> implements ITokenBalanceCache {
  private _nodes: { [id: number]: IChainNode } = {};
  private _providers: { [name: string]: BalanceProvider } = {};
  private _lastQueryTime: number = 0;
  constructor(
    noBalancePruneTimeS: number = 5 * 60,
    private readonly _hasBalancePruneTimeS: number = 1 * 60 * 60,
    providers: BalanceProvider[] = BalanceProviders,
    private readonly _nodesProvider: (lastQueryUnixTime: number) => Promise<IChainNode[]> = queryChainNodesFromDB,
  ) {
    super({}, noBalancePruneTimeS);
    for (const provider of providers) {
      this._providers[provider.name] = provider;
    }
  }

  public async getChainNodes(): Promise<ChainNodeResp[]> {
    return Object.values(this._nodes)
      .map(({ id, name, description, balance_type, ss58, bech32 }) => ({
        id,
        name,
        description,
        base: balance_type,
        prefix: bech32 || ss58?.toString()
      }));
  }

  public async getBalanceProviders(nodeId?: number): Promise<BalanceProviderResp[]> {
    const formatBps = (bps: BalanceProvider[]): BalanceProviderResp[] => {
      return bps.map(({ name, opts }) => ({ bp: name, opts }));
    };

    // return all available providers if no nodeId passed
    if (!nodeId) {
      return formatBps(Object.values(this._providers));
    }

    // otherwise, return bps that support node's base
    // TODO: ensure all nodes have proper bases / balance types in db...
    const node = this._nodes[nodeId];
    if (!node) throw new Error('Could not find node');
    const base = node.balance_type;
    const bps = Object.values(this._providers).filter(({ validBases }) => validBases.includes(base));
    return formatBps(bps);
  }

  public async getBalancesForAddresses(
    nodeId: number,
    addresses: string[],
    balanceProvider: string,
    opts: Record<string, string | undefined>,
  ): Promise<TokenBalanceResp> {
    const node = this._nodes[nodeId];
    if (!node) {
      throw new Error('unknown node id');
    }
    const [{ bp }] = await this.getBalanceProviders(nodeId);
    if (bp !== balanceProvider) {
      throw new Error('balance provider not valid for node');
    }
    const providerObj = this._providers[balanceProvider];

    const getBalance = async (address: string): Promise<string> => {
      const cacheKey = providerObj.getCacheKey(node, address, opts)
      const result = await this.access((async (c: ICache): Promise<string | undefined> => {
        if (c[cacheKey]) {
          return c[cacheKey].balance;
        } else {
          return undefined;
        }
      }));
      if (result !== undefined) return result;

      // fetch balance if not found in cache
      const fetchedAt = Date.now();

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

  private async _refreshNodes() {
    const lastQueryTime = this._lastQueryTime;
    this._lastQueryTime = Math.floor(Date.now() / 1000);
    const nodes = await this._nodesProvider(lastQueryTime);
    for (const n of nodes) {
      this._nodes[n.id] = n;
    }
  }

  public async start() {
    // all nodes at startup
    this._nodes = {};
    await this._refreshNodes();

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
    // clear stale cache members
    for (const key of Object.keys(cache)) {
      if (new BN(cache[key].balance).eqn(0)) {
        // 5 minute lifetime (i.e. one job run) if no token balance
        delete cache[key];
      } else {
        // 1 hour lifetime if token balance exists
        const cutoff = Date.now() - (this._hasBalancePruneTimeS * 1000);
        const fetchedAt = cache[key].fetchedAt;
        if (fetchedAt <= cutoff) {
          delete cache[key];
        }
      }
    }

    // run update query
    await this._refreshNodes();
  }
}
