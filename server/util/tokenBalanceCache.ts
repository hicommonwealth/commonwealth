import moment from 'moment';
import Web3 from 'web3';
import BN from 'bn.js';
import { providers } from 'ethers';

import { ERC20__factory } from '../../shared/eth/types';
import { TokenResponse } from '../../shared/types';

import JobRunner from './cacheJobRunner';
import { slugify } from '../../shared/utils';

import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

// map of addresses to balances
interface CacheT {
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

export class TokenBalanceProvider {
  private _provider: providers.Web3Provider;
  constructor(private _network = 'mainnet') {
    let web3Provider;
    if (this._network === 'mainnet') {
      web3Provider = new Web3.providers.HttpProvider(`https://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr`);
    } else if (this._network === 'ropsten') {
      web3Provider = new Web3.providers.HttpProvider(`https://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7`);
    } else {
      throw new Error('invalid network');
    }
    this._provider = new providers.Web3Provider(web3Provider);
    // 12s minute polling interval (default is 4s)
    this._provider.pollingInterval = 12000;
  }

  public async getBalance(tokenAddress: string, userAddress: string): Promise<BN> {
    const api = ERC20__factory.connect(tokenAddress, this._provider);
    await api.deployed();
    const balanceBigNum = await api.balanceOf(userAddress);
    return new BN(balanceBigNum.toString());
  }
}

export default class TokenBalanceCache extends JobRunner<CacheT> {
  private models: DB;
  constructor(
    models: DB,
    noBalancePruneTimeS: number = 5 * 60,
    private readonly _hasBalancePruneTimeS: number = 24 * 60 * 60,
    private readonly _balanceProvider = new TokenBalanceProvider(),
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
  public async getBalance(contractId: string, address: string, network = 'mainnet'): Promise<BN> {
    const tokenMeta = await this.models.ChainNode.findOne({ where: { chain: contractId } })
      || await this.models.Token.findOne({ where: { id: contractId } });
    if (!tokenMeta?.address) throw new Error('unsupported token');

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
      balance = await this._balanceProvider.getBalance(tokenMeta.address, address);
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
