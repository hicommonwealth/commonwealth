import { Client } from 'pg';

import { ChainNetwork } from '@hicommonwealth/core';
import BN from 'bn.js';
import JobRunner from 'common-common/src/cacheJobRunner';
import { factory, formatFilename } from 'common-common/src/logging';

import { TbcStatsDSender } from './tbcStatsDSender';
import type {
  BalanceProvider,
  BalanceProviderResp,
  ChainNodeResp,
  ICache,
  IChainNode,
  ITokenBalanceCache,
  TokenBalanceResp,
} from './types';
import { FetchTokenBalanceErrors } from './types';

const log = factory.getLogger(formatFilename(__filename));

async function queryChainNodesFromDB(
  lastQueryUnixTime: number,
): Promise<IChainNode[]> {
  const query = `SELECT * FROM "ChainNodes" WHERE updated_at >= to_timestamp (${lastQueryUnixTime})::date;`;

  const DATABASE_URI =
    !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
      ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
      : process.env.DATABASE_URL;

  const db = new Client({
    connectionString: DATABASE_URI,
    ssl:
      process.env.NODE_ENV !== 'production' || process.env.NO_SSL
        ? false
        : {
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
export class TokenBalanceCache
  extends JobRunner<ICache>
  implements ITokenBalanceCache
{
  private _nodes: { [id: number]: IChainNode } = {};
  private _providers: { [name: string]: BalanceProvider<any> } = {};
  // Maps global chain id -> Common DB chainIds for quick lookup in _nodes
  private _chainIds: { [id: string]: number } = {};
  private _lastQueryTime = 0;
  private statsDSender: TbcStatsDSender = new TbcStatsDSender();
  private cacheContents = { zero: 0, nonZero: 0 };

  constructor(
    noBalancePruneTimeS: number = 5 * 60,
    private readonly _hasBalancePruneTimeS: number = 1 * 60 * 60,
    providers: BalanceProvider<any>[] = null,
    private readonly _nodesProvider: (
      lastQueryUnixTime: number,
    ) => Promise<IChainNode[]> = queryChainNodesFromDB,
  ) {
    super({}, noBalancePruneTimeS);

    // if providers is set, init during constructor
    if (providers != null) {
      for (const provider of providers) {
        this._providers[provider.name] = provider;
      }
    }
  }

  public async initBalanceProviders(providers: BalanceProvider<any>[] = null) {
    // lazy load import to improve test speed
    if (providers == null) {
      const p = await import('./providers');
      providers = p.default;
    }
    for (const provider of providers) {
      this._providers[provider.name] = provider;
    }
  }

  public async getChainNodes(): Promise<ChainNodeResp[]> {
    return Object.values(this._nodes).map(
      ({ id, name, description, balance_type, ss58, bech32 }) => ({
        id,
        name,
        description,
        base: balance_type,
        prefix: bech32 || ss58?.toString(),
      }),
    );
  }

  public async getBalanceProviders(
    nodeId?: number,
  ): Promise<BalanceProviderResp[]> {
    const formatBps = (bps: BalanceProvider<any>[]): BalanceProviderResp[] => {
      this.statsDSender.sendProviderInfo(bps, nodeId);
      return bps.map(({ name, opts }) => ({ bp: name, opts }));
    };

    // return all available providers if no nodeId passed
    if (!nodeId) {
      return formatBps(Object.values(this._providers));
    }

    // otherwise, return bps that support node's base
    // TODO: ensure all nodes have proper bases / balance types in db...
    const node = this._nodes[nodeId];
    if (!node) {
      const e = new Error('Could not find node');
      this.statsDSender.sendError(e);
      throw e;
    }
    const base = node.balance_type;
    const bps = Object.values(this._providers).filter(({ validBases }) =>
      validBases.includes(base),
    );
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
      const e = new Error('unknown node id');
      this.statsDSender.sendError(e);
      throw e;
    }
    const [{ bp }] = await this.getBalanceProviders(nodeId);
    if (bp !== balanceProvider) {
      const e = new Error('balance provider not valid for node');
      this.statsDSender.sendError(e);
      throw e;
    }
    const providerObj = this._providers[balanceProvider];

    const getBalance = async (address: string): Promise<string> => {
      const cacheKey = providerObj.getCacheKey(node, address, opts);
      const result = await this.access(
        async (c: ICache): Promise<string | undefined> => {
          if (c[cacheKey]) {
            return c[cacheKey].balance;
          } else {
            return undefined;
          }
        },
      );
      if (result !== undefined) return result;

      // fetch balance if not found in cache
      const fetchedAt = Date.now();

      // will throw on invalid chain / other error
      const balance = await providerObj.getBalance(node, address, opts);

      // write fetched balance back to cache
      await this.access(async (c: ICache) => {
        c[cacheKey] = { balance, fetchedAt };

        if (new BN(balance).eqn(0)) {
          this.cacheContents['zero']++;
        } else {
          this.cacheContents['nonZero']++;
        }
      });
      return balance;
    };

    const results = {
      balances: {},
      errors: {},
    };

    await Promise.all(
      addresses.map(async (address) => {
        try {
          const start = Date.now();
          const balance = await getBalance(address);
          this.statsDSender.sendFetchTiming(
            start,
            Date.now(),
            providerObj.name,
            nodeId,
          );

          results.balances[address] = balance;
        } catch (e) {
          results.errors[address] = e.message;
        }
      }),
    );

    return results;
  }

  // Backwards compatibility function to fetch a single user's token balance
  // in a context where a chain node only has a single balance provider.
  public async fetchUserBalance(
    network: ChainNetwork,
    nodeId: number,
    userAddress: string,
    contractAddress?: string,
    tokenId?: string,
  ): Promise<string> {
    let bp: string;
    try {
      const providersResult = await this.getBalanceProviders(nodeId);
      bp = providersResult[0].bp;
    } catch (e) {
      throw new Error(FetchTokenBalanceErrors.NoBalanceProvider);
    }

    // grab contract if provided, otherwise query native token
    let opts = {};
    if (contractAddress) {
      if (
        network !== ChainNetwork.ERC20 &&
        network !== ChainNetwork.ERC721 &&
        network !== ChainNetwork.ERC1155
      ) {
        throw new Error(FetchTokenBalanceErrors.UnsupportedContractType);
      }
      if (network === ChainNetwork.ERC1155) {
        opts = {
          tokenAddress: contractAddress,
          contractType: network,
          tokenId: tokenId,
        };
      } else {
        opts = {
          tokenAddress: contractAddress,
          contractType: network,
        };
      }
    }

    let balancesResp: TokenBalanceResp;
    try {
      balancesResp = await this.getBalancesForAddresses(
        nodeId,
        [userAddress],
        bp,
        opts,
      );
    } catch (err) {
      throw new Error('Query Failed');
    }

    if (balancesResp.balances[userAddress]) {
      return balancesResp.balances[userAddress];
    } else if (balancesResp.errors[userAddress]) {
      throw new Error(
        `Error querying balance: ${balancesResp.errors[userAddress]}`,
      );
    } else {
      throw new Error('Query failed');
    }
  }

  public async fetchUserBalanceWithChain(
    network: ChainNetwork,
    userAddress: string,
    chainId: string,
    contractAddress?: string,
    tokenId?: string,
  ): Promise<string> {
    const nodeId = this._chainIds[chainId];
    if (!nodeId) {
      throw new Error('Invalid Chain Id');
    }
    const balance = await this.fetchUserBalance(
      network,
      nodeId,
      userAddress,
      contractAddress,
      tokenId,
    );
    return balance;
  }

  private async _refreshNodes() {
    const lastQueryTime = this._lastQueryTime;
    this._lastQueryTime = Math.floor(Date.now() / 1000);
    const nodes = await this._nodesProvider(lastQueryTime);
    for (const n of nodes) {
      this._nodes[n.id] = n;
      if (n.eth_chain_id) {
        this._chainIds[n.eth_chain_id.toString()] = n.id;
      } else if (n.cosmos_chain_id) {
        this._chainIds[n.cosmos_chain_id] = n.id;
      }
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
        this.statsDSender.sendJobItemRemoved(key);
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

        this.cacheContents['zero']--;
      } else {
        // 1 hour lifetime if token balance exists
        const cutoff = Date.now() - this._hasBalancePruneTimeS * 1000;
        const fetchedAt = cache[key].fetchedAt;
        if (fetchedAt <= cutoff) {
          delete cache[key];

          this.cacheContents['nonZero']--;
        }
      }
    }

    this.statsDSender.sendCacheSizeInfo(this.cacheContents);

    // run update query
    await this._refreshNodes();
  }
}
