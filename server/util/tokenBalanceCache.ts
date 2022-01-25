import moment from 'moment';
import Web3 from 'web3';
import * as solw3 from '@solana/web3.js';
import BN from 'bn.js';
import { providers } from 'ethers';
import { WhereOptions } from 'sequelize/types';

import { ERC20__factory } from '../../shared/eth/types';

import JobRunner from './cacheJobRunner';

import { ChainAttributes } from '../models/chain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { ChainBase, ChainType } from '../../shared/types';
import { getUrlsForEthChainId } from './supportedEthChains';

const log = factory.getLogger(formatFilename(__filename));

function getKey(chainBase: string, chainId: number, contract: string, address: string) {
  return `${chainBase}-${chainId}-${contract}-${address}`;
}

// map of addresses to balances
interface CacheT {
  [cacheKey: string]: {
    balance: BN,
    fetchedAt: moment.Moment;
  }
}

// Uses a tiny class so it's mockable for testing
export class TokenBalanceProvider {
  public async getEthTokenBalance(url: string, tokenAddress: string, userAddress: string): Promise<BN> {
    const provider = new Web3.providers.WebsocketProvider(url);
    const api = ERC20__factory.connect(tokenAddress, new providers.Web3Provider(provider));
    await api.deployed();
    const balanceBigNum = await api.balanceOf(userAddress);
    provider.disconnect(1000, 'finished');
    return new BN(balanceBigNum.toString());
  }

  public async getSplTokenBalance(cluster: solw3.Cluster, mint: string, user: string): Promise<BN> {
    const url = solw3.clusterApiUrl(cluster);
    const connection = new solw3.Connection(url);
    const mintPubKey = new solw3.PublicKey(mint);
    const userPubKey = new solw3.PublicKey(user);
    const { value } = await connection.getParsedTokenAccountsByOwner(
      userPubKey,
      { mint: mintPubKey },
    );
    const amount: string = value[0]?.account?.data?.parsed?.info?.tokenAmount?.amount;
    return new BN(amount, 10);
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

  public async start() {
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

  public async validateTopicThreshold(topicId: number, userAddress: string): Promise<boolean> {
    if (!topicId || !userAddress) return true;
    try {
      const topic = await this.models.OffchainTopic.findOne({
        where: { id: topicId },
        include: [
          {
            model: this.models.Chain,
            required: true,
            as: 'chain',
            where: {
              // only support thresholds on token forums
              // TODO: can we support for token-backed DAOs as well?
              type: ChainType.Token,
            } as WhereOptions<ChainAttributes>
          },
        ]
      });
      if (!topic?.chain) {
        // if associated with an offchain community, or if not token forum, always allow
        return true;
      }
      const threshold = topic.token_threshold;
      if (threshold && threshold > 0) {
        const nodes = await this.models.ChainNode.findAll({ where: { chain: topic.chain.id } });
        if (!nodes || (topic.chain.base === ChainBase.Ethereum && !nodes[0].eth_chain_id)) {
          throw new Error('Could not find chain node.');
        }
        const tokenBalance = await this.getBalance(
          topic.chain.base,
          topic.chain.id,
          userAddress,
          nodes[0].eth_chain_id,
        );
        log.info(`Balance: ${tokenBalance.toString()}, threshold: ${threshold.toString()}`);
        return (new BN(tokenBalance)).gten(threshold);
      } else {
        return true;
      }
    } catch (err) {
      log.warn(`Could not validate topic threshold for ${topicId}: ${err.message}`);
      return false;
    }
  }

  // query a user's balance on a given token contract and save in cache
  public async getBalance(base: string, contractId: string, address: string, chainId?: number): Promise<BN> {
    let contractAddress: string;
    // See if token is already in the database as a Chain
    const node = await this.models.ChainNode.findOne({
      where: {
        chain: contractId,
        eth_chain_id: chainId || null,
      }
    });
    if (node?.address) {
      contractAddress = node.address;
    }

    // if token is not in the database, then query against the Token list
    if (!contractAddress && base === ChainBase.Ethereum) {
      const tokenMeta = await this.models.Token.findOne({
        where: {
          id: contractId,
          chain_id: chainId,
        }
      });
      if (!tokenMeta?.address) throw new Error('unsupported token');
      contractAddress = tokenMeta.address;
    } else if (!contractAddress) {
      throw new Error('unsupported token');
    }

    // check the cache for the token balance
    const cacheKey = getKey(base, chainId, contractAddress, address);
    const result = await this.access((async (c: CacheT): Promise<BN | undefined> => {
      if (c[cacheKey]) {
        return c[cacheKey].balance;
      } else {
        return undefined;
      }
    }));
    if (result !== undefined) return result;

    // fetch balance if not found in cache
    let balance: BN;
    const fetchedAt = moment();
    if (base === ChainBase.Ethereum) {
      const urls = await getUrlsForEthChainId(this.models, chainId);
      if (!urls) {
        throw new Error(`unsupported eth chain id ${chainId}`);
      }
      const url = urls.url;
      try {
        balance = await this._balanceProvider.getEthTokenBalance(url, contractAddress, address);
      } catch (e) {
        throw new Error(`Could not fetch token balance: ${e.message}`);
      }
    } else if (base === ChainBase.Solana) {
      try {
        balance = await this._balanceProvider.getSplTokenBalance(node.url as solw3.Cluster, contractAddress, address);
      } catch (e) {
        throw new Error(`Could not fetch token balance: ${e.message}`);
      }
    } else {
      throw new Error('Invalid token chain base');
    }

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
