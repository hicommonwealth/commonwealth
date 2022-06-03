import moment from 'moment';
import Web3 from 'web3';
import { StateMutabilityType, AbiType } from 'web3-utils';
import * as solw3 from '@solana/web3.js';
import BN from 'bn.js';
import { providers } from 'ethers';
import { WhereOptions } from 'sequelize/types';

import { ContractAttributes } from 'server/models/contract';
import { ERC20__factory, ERC721__factory } from '../../shared/eth/types';

import JobRunner from './cacheJobRunner';

import { ChainAttributes } from '../models/chain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { ChainBase, ChainNetwork, ChainType, ContractTypes } from '../../shared/types';

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

  public async getRoninTokenBalance(address: string) {
    // TODO: make configurable
    const rpcUrl = 'https://api.roninchain.com/rpc';
    const provider = new Web3.providers.HttpProvider(rpcUrl);
    const web3 = new Web3(provider);
    const axsAddress = '0x97a9107c1793bc407d6f527b77e7fff4d812bece';
    const axsStakingPoolAddress = '05b0bb3c1c320b280501b86706c3551995bc8571';

    const axsApi = ERC20__factory.connect(axsAddress, new providers.Web3Provider(provider as any));
    await axsApi.deployed();
    const axsBalanceBigNum = await axsApi.balanceOf(address);

    const axsStakingAbi = [
      {
        'constant': true,
        'inputs': [
          {
            'internalType': 'address',
            'name': '_user',
            'type': 'address'
          }
        ],
        'name': 'getStakingAmount',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': '',
            'type': 'uint256'
          }
        ],
        'payable': false,
        'stateMutability': 'view' as StateMutabilityType,
        'type': 'function' as AbiType,
      },
    ];
    const axsStakingPoolContract = new web3.eth.Contract(axsStakingAbi, axsStakingPoolAddress);
    const stakingPoolBalance = await axsStakingPoolContract.methods.getStakingAmount(address).call();
    provider.disconnect();
    return new BN(axsBalanceBigNum.toString()).add(new BN(stakingPoolBalance.toString()));
  }

  public async getEthTokenBalance(url: string, type: string,
  tokenAddress: string, userAddress: string): Promise<BN> {
    const provider = new Web3.providers.WebsocketProvider(url);
    let api;
    if(type === ContractTypes.ERC20) {
      api = ERC20__factory.connect(tokenAddress, new providers.Web3Provider(provider as any));
    }
    else if(type === ContractTypes.ERC721) {
      api = ERC721__factory.connect(tokenAddress, new providers.Web3Provider(provider as any));
    }
    else {
      throw new Error('Invalid token chain network');
    }
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
      // TODO: Remove this once we have RULES doing the queries by contract.
      const communityContract = await this.models.CommunityContract.findOne({
        where: { community_id: topic.chain_id, },
        include: [{
          model: this.models.Contract,
          required: true,
        }],
      });
      if (!topic?.chain) {
        // if associated with an offchain community, or if not token forum, always allow
        return true;
      }
      const threshold = topic.token_threshold;
      if (threshold && threshold > 0) {
        // TODO: FIX
        const tokenBalance = await this.getBalance(
          communityContract.Contract,
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
  public async getBalance(contract: ContractAttributes, address: string): Promise<BN> {
    const node = await this.models.ChainNode.scope('withPrivateData')
      .findOne({
        where: { id: contract.chain_node_id }});
    if (!node) {
      throw new Error('Could not find chain node.');
    }

    // check the cache for the token balance
    const cacheKey = getKey(node.chain_base, node.eth_chain_id, contract.address, address);
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
    let contractAddress = contract.address;
    // TODO: Fix this axie hack
    if (node.id == 47) {
      // special case for axie query using covalent
      try {
        balance = await this._balanceProvider.getRoninTokenBalance(address);
      } catch (e) {
        throw new Error(`Could not fetch token balance: ${e.message}`);
      }
    } else if (node.chain_base === ChainBase.Ethereum) {
      if (!contract.address) {
        // if token is not in the database, then query against the Token list
        const tokenMeta = await this.models.Token.findOne({
          where: {
            id: contract.address,
            chain_id: node.eth_chain_id,
          }
        });
        if (!tokenMeta?.address) throw new Error('unsupported token');
        contractAddress = tokenMeta.address;
      } else if (!contractAddress) {
        throw new Error('unsupported token');
      }

      const url = node.private_url || node.url;
      try {
        balance = await this._balanceProvider.getEthTokenBalance(url, contract.type, contractAddress, address);
      } catch (e) {
        throw new Error(`Could not fetch token balance: ${e.message}`);
      }
    } else if (node.chain_base === ChainBase.Solana) {
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
