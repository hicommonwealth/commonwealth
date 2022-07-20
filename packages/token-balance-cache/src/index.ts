import moment from 'moment';
import { Client } from 'pg';

import BN from 'bn.js';
import { factory, formatFilename } from 'common-common/src/logging';
import { BalanceType } from 'common-common/src/types';
import JobRunner from 'common-common/src/cacheJobRunner';

import TokenBalanceProvider from './provider';
import { ContractType, parseContractType } from './types';

const log = factory.getLogger(formatFilename(__filename));

const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

function getKey(chainNodeId: number, address: string, contract?: string) {
  return `${chainNodeId}-${address}-${contract}`;
}

// map of addresses to balances
interface CacheT {
  [cacheKey: string]: {
    balance: BN,
    fetchedAt: moment.Moment;
  }
}

type ChainNodeT = {
  id: number;
  url: string;
  eth_chain_id?: number;
  alt_wallet_url?: string;
  private_url?: string;
  balance_type?: BalanceType;
  name?: string;
  description?: string;
}

export default class TokenBalanceCache extends JobRunner<CacheT> {
  private _nodes: { [id: number]: ChainNodeT } = {};
  constructor(
    noBalancePruneTimeS: number = 5 * 60,
    private readonly _hasBalancePruneTimeS: number = 24 * 60 * 60,
    private readonly _balanceProvider = new TokenBalanceProvider(),
  ) {
    super({}, noBalancePruneTimeS);
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
    const nodeQuery = await db.query<ChainNodeT>(`SELECT * FROM "ChainNodes";`);
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

  // query a user's balance on a given token contract and save in cache
  public async getBalance(
    nodeId: number,
    address: string,
    contractAddress?: string,
    contractTypeString?: string
  ): Promise<BN> {
    if (contractAddress && !contractTypeString) {
      throw new Error('Must specify contract type if providing contract address');
    }
    if (contractTypeString && !contractAddress) {
      throw new Error('Must specify contract address if providing contract type');
    }
    let contractType: ContractType | undefined;
    if (contractTypeString) {
      contractType = parseContractType(contractTypeString);
    }
    const node = this._nodes[nodeId];
    if (!node) {
      throw new Error('Node ID not found!');
    }
    if (!node.balance_type) {
      throw new Error('Node balance type not found!');
    }

    // check the cache for the token balance
    const cacheKey = getKey(nodeId, address, contractAddress);
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
    const url = node.private_url || node.url;

    // will throw on invalid chain / other error
    const balance = await this._balanceProvider.getTokenBalance(
      address,
      node.balance_type,
      url,
      contractAddress,
      contractType,
    );

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
