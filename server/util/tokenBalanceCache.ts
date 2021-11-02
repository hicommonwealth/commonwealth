import moment from 'moment';
import Web3 from 'web3';
import BN from 'bn.js';
import { providers } from 'ethers';

import { ERC20__factory } from '../../shared/eth/types';

import JobRunner from './cacheJobRunner';

import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { ChainNodeInstance } from '../models/chain_node';
import { wsToHttp } from '../../shared/utils';

const log = factory.getLogger(formatFilename(__filename));

// map of addresses to balances
interface CacheT {
  // TODO: should we add another layer/identifier here,
  // in case two contracts collide across ETH networks ?
  [contract: string]: {
    [address: string]: {
      balance: BN,
      fetchedAt: moment.Moment;
    };
  };
}

export interface TokenForumMeta {
  id: string;
  address: string;
  iconUrl: string;
  name: string;
  symbol: string;
  balanceThreshold?: BN;
  decimals: number;
}

async function getBalance(url: string, tokenAddress: string, userAddress: string): Promise<BN> {
  const provider = new Web3.providers.HttpProvider(url);
  const api = ERC20__factory.connect(tokenAddress, new providers.Web3Provider(provider));
  await api.deployed();
  const balanceBigNum = await api.balanceOf(userAddress);
  return new BN(balanceBigNum.toString());
}

export default class TokenBalanceCache extends JobRunner<CacheT> {
  private models: DB;
  constructor(
    models: DB,
    noBalancePruneTimeS: number = 5 * 60,
    private readonly _hasBalancePruneTimeS: number = 24 * 60 * 60,
  ) {
    super({}, noBalancePruneTimeS);
    this.models = models;
  }

  public async start(prefetchedTokenMeta?: TokenForumMeta[]) {
    if (prefetchedTokenMeta) {
      // write init values into saved cache
      await this.access(async (cache) => {
        for (const { id } of prefetchedTokenMeta) {
          cache[id] = { };
        }
      });
    }

    // kick off job
    super.start();
    log.info(`Started Token Balance Cache with ${prefetchedTokenMeta ? prefetchedTokenMeta.length : 0} tokens.`);
  }

  public async reset(prefetchedTokenMeta?: TokenForumMeta[]) {
    super.close();
    await this.access(async (cache) => {
      for (const key of Object.keys(cache)) {
        delete cache[key];
      }
    });
    return this.start(prefetchedTokenMeta);
  }

  // query a user's balance on a given token contract and save in cache
  public async getBalance(contractId: string, address: string, url?: string): Promise<BN> {
    const tokenMeta = await this.models.ChainNode.findOne({ where: { chain: contractId } })
      || await this.models.Token.findOne({ where: { id: contractId } });
    if (!tokenMeta?.address) throw new Error('unsupported token');
    const tokenUrl = (tokenMeta as ChainNodeInstance)?.url || url;
    if (!url) throw new Error('no token url found');
    const tokenUrlHttp = wsToHttp(tokenUrl);

    // first check the cache for the token balance
    const result = await this.access((async (c: CacheT): Promise<BN | undefined> => {
      if (c[contractId]) {
        return c[contractId][address]?.balance;
      } else {
        return undefined;
      }
    }));
    if (result !== undefined) return result;

    // fetch balance if not found in cache
    let balance: BN;
    try {
      balance = await getBalance(tokenUrlHttp, tokenMeta.address, address);
    } catch (e) {
      throw new Error(`Could not fetch token balance: ${e.message}`);
    }
    const fetchedAt = moment();

    // write fetched balance back to cache
    await this.access((async (c: CacheT) => {
      if (!c[contractId]) {
        c[contractId] = {};
      }
      c[contractId][address] = { balance, fetchedAt };
    }));
    return balance;
  }

  // prune cache job
  protected async _job(cache: CacheT): Promise<void> {
    for (const contract of Object.keys(cache)) {
      for (const address of Object.keys(cache[contract])) {
        if (cache[contract][address].balance.eqn(0)) {
          // 5 minute lifetime (i.e. one job run) if no token balance
          delete cache[contract][address];
        } else {
          // 24 hour lifetime if token balance
          const cutoff = moment().subtract(this._hasBalancePruneTimeS, 'seconds');
          const fetchedAt = cache[contract][address].fetchedAt;
          if (fetchedAt.isSameOrBefore(cutoff)) {
            delete cache[contract][address];
          }
        }
      }
    }
  }
}
