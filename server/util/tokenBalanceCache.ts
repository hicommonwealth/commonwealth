import moment from 'moment';
import Web3 from 'web3';
import BN from 'bn.js';
import { providers } from 'ethers';

import { INFURA_API_KEY } from '../config';
import { Erc20Factory } from '../../eth/types/Erc20Factory';
import { TokenResponse } from '../../shared/types';

import JobRunner from './cacheJobRunner';
import TokenListCache from './tokenListCache';
import { slugify } from '../../shared/utils';

import { factory, formatFilename } from '../../shared/logging';
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
  constructor(private _network = 'mainnet') { }

  public async getBalance(tokenAddress: string, userAddress: string): Promise<BN> {
    const web3Provider = new Web3.providers.HttpProvider(`https://${this._network}.infura.io/v3/${INFURA_API_KEY}`);
    const provider = new providers.Web3Provider(web3Provider);
    const api = Erc20Factory.connect(tokenAddress, provider);
    const balanceBigNum = await api.balanceOf(userAddress);
    return new BN(balanceBigNum.toString());
  }
}

export default class TokenBalanceCache extends JobRunner<CacheT> {
  private _contracts: TokenForumMeta[];

  constructor(
    private readonly _listCache: TokenListCache,
    noBalancePruneTimeS: number = 5 * 60,
    private readonly _hasBalancePruneTimeS: number = 24 * 60 * 60,
    private readonly _balanceProvider = new TokenBalanceProvider(),
  ) {
    super({}, noBalancePruneTimeS);
    this._listCache = new TokenListCache();
  }

  private async _connectTokens(models): Promise<TokenForumMeta[]> {
    // initialize metadata from database
    const dbTokens = await models['Chain'].findAll({
      where: { type: 'token' },
      include: [ models['ChainNode'] ],
    });

    // TODO: support customized balance thresholds
    // TODO: support ChainId
    const tokens: TokenForumMeta[] = dbTokens
      .filter(({ ChainNodes }) => ChainNodes && ChainNodes[0]?.address)
      .map((chain): TokenForumMeta => ({
        id: chain.id,
        address: chain.ChainNodes[0].address,
        name: chain.name,
        symbol: chain.symbol,
        iconUrl: chain.icon_url,
        decimals: chain.decimals
      }));

    try {
      const tokensFromListsResponses = await this._listCache.getTokens();
      const tokensFromLists: TokenForumMeta[] = tokensFromListsResponses
        .map((o) => {
          return {
            id: slugify(o.name),
            address: o.address,
            name: o.name,
            symbol: o.symbol,
            iconUrl: o.logoURI,
            decimals: o.decimals
          };
        });

      return [...tokens, ...tokensFromLists];
    } catch (e) {
      log.error('An error occurred trying to access token lists', e.message);
    }

    return tokens;
  }

  public getToken(searchAddress: string): TokenForumMeta {
    return this._contracts.find(({ address }) => address === searchAddress);
  }

  public async start(models?, prefetchedTokenMeta?: TokenForumMeta[]) {
    if (!prefetchedTokenMeta) {
      const tokenMeta = await this._connectTokens(models);
      this._contracts = tokenMeta;
    } else {
      this._contracts = prefetchedTokenMeta;
    }

    // write init values into saved cache
    await this.access(async (cache) => {
      for (const { id } of this._contracts) {
        cache[id] = { };
      }
    });

    // kick off job
    super.start();
    log.info(`Started Token Balance Cache with ${this._contracts.length} tokens.`);
  }

  public async reset(models?, prefetchedTokenMeta?: TokenForumMeta[]) {
    super.close();
    await this.access(async (cache) => {
      for (const key of Object.keys(cache)) {
        delete cache[key];
      }
    });
    return this.start(models, prefetchedTokenMeta);
  }

  public getTokens(): Promise<TokenResponse[]> {
    return this._listCache.getTokens();
  }

  public async hasToken(contractId: string, address: string, network = 'mainnet'): Promise<boolean> {
    const tokenMeta = this._contracts.find(({ id }) => id === contractId);
    if (!tokenMeta) throw new Error('unsupported token');
    const threshold = tokenMeta.balanceThreshold || new BN(1);
    const balance = await this.getBalance(contractId, address);
    return balance.gt(threshold);
  }

  // query a user's balance on a given token contract and save in cache
  public async getBalance(contractId: string, address: string, network = 'mainnet'): Promise<BN> {
    const tokenMeta = this._contracts.find(({ id }) => id === contractId);
    if (!tokenMeta) throw new Error('unsupported token');

    // first check the cache for the token balance
    const result = await this.access((async (c: CacheT): Promise<BN | undefined> => {
      return c[contractId][address]?.balance;
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
