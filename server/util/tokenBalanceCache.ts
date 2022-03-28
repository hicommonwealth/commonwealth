import moment from 'moment';
import Web3 from 'web3';
import * as solw3 from '@solana/web3.js';
import BN from 'bn.js';
import { providers } from 'ethers';
import { WhereOptions } from 'sequelize/types';
import axios from 'axios';

import { ERC20__factory } from '../../shared/eth/types';

import JobRunner from './cacheJobRunner';

import { ChainAttributes } from '../models/chain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { COVALENT_API_KEY } from '../config';
import { ChainBase, ChainNetwork, ChainType } from '../../shared/types';
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
  public async getRoninTokenBalance(address: string, chainId: number) {
    const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/`;
    try {
      if (!COVALENT_API_KEY) {
        throw new Error('failed to query axie balance');
      }
      const balanceQueryResultString = await axios.post(url, { }, {
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: COVALENT_API_KEY,
          password: '',
        }
      });
      const balanceQueryResult = JSON.parse(balanceQueryResultString.data);
      console.log(balanceQueryResult);
      if (balanceQueryResult.error) {
        throw new Error(balanceQueryResult.error_message)
      }
      const axieItem = balanceQueryResult.data.items.find((item) => item.contract_ticker_symbol === 'RON');
      return new BN(axieItem.balance, 10);
    } catch (e) {
      log.info(`Failed to query axie balance: ${e.message}`);
      throw new Error('failed to query axie balance');
    }
  }

  public async getEthTokenBalance(url: string, tokenAddress: string, userAddress: string): Promise<BN> {
    const provider = new Web3.providers.WebsocketProvider(url);
    const api = ERC20__factory.connect(tokenAddress, new providers.Web3Provider(provider as any));
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
        const tokenBalance = await this.getBalance(
          topic.chain,
          userAddress,
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
  public async getBalance(chain: ChainAttributes, address: string): Promise<BN> {
    const nodes = await this.models.ChainNode.findAll({ where: { chain: chain.id } });
    if (!nodes || (chain.base === ChainBase.Ethereum && !nodes[0].eth_chain_id)) {
      throw new Error('Could not find chain node.');
    }
    const [node] = nodes;
    let contractAddress: string;
    if (node?.address) {
      contractAddress = node.address;
    }

    // check the cache for the token balance
    const cacheKey = getKey(chain.base, node.eth_chain_id, contractAddress, address);
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
    // TODO: add cosmos and other chains
    if (chain.network === ChainNetwork.AxieInfinity) {
      // special case for axie query using covalent
      try {
        balance = await this._balanceProvider.getRoninTokenBalance(address, node.eth_chain_id);
      } catch (e) {
        throw new Error(`Could not fetch token balance: ${e.message}`);
      }
    } else if (chain.base === ChainBase.Ethereum) {
      if (!contractAddress) {
        // if token is not in the database, then query against the Token list
        const tokenMeta = await this.models.Token.findOne({
          where: {
            id: contractAddress,
            chain_id: node.eth_chain_id,
          }
        });
        if (!tokenMeta?.address) throw new Error('unsupported token');
        contractAddress = tokenMeta.address;
      } else if (!contractAddress) {
        throw new Error('unsupported token');
      }

      const urls = await getUrlsForEthChainId(this.models, node.eth_chain_id);
      if (!urls) {
        throw new Error(`unsupported eth chain id ${node.eth_chain_id}`);
      }
      const url = urls.url;
      try {
        balance = await this._balanceProvider.getEthTokenBalance(url, contractAddress, address);
      } catch (e) {
        throw new Error(`Could not fetch token balance: ${e.message}`);
      }
    } else if (chain.base === ChainBase.Solana) {
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
