import moment from 'moment';
import Web3 from 'web3';
import { StateMutabilityType, AbiType } from 'web3-utils';
import * as solw3 from '@solana/web3.js';
import {
  QueryClient,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { LCDClient } from '@terra-money/terra.js';

import BN from 'bn.js';
import { providers } from 'ethers';
import { WhereOptions } from 'sequelize/types';

import { ERC20__factory, ERC721__factory } from '../../shared/eth/types';

import JobRunner from './cacheJobRunner';

import { ChainAttributes } from '../models/chain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { ChainBase, ChainNetwork, ChainType } from '../../shared/types';

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
  public async getTokenBalance(
    address: string,
    chain: ChainAttributes,
    url?: string,
    contractAddress?: string
  ): Promise<BN> {
    // TODO: add near/sputnik
    if (chain.network === ChainNetwork.AxieInfinity) {
      return this._getRoninTokenBalance(address);
    } else if (chain.network === ChainNetwork.Terra) {
      return this._getTerraTokenBalance(url, address);
    } else if (chain.base === ChainBase.Ethereum) {
      return this._getEthTokenBalance(url, chain.network, contractAddress, address);
    } else if (chain.base === ChainBase.Solana) {
      return this._getSplTokenBalance(url as solw3.Cluster, contractAddress, address);
    } else if (chain.base === ChainBase.CosmosSDK) {
      return this._getCosmosTokenBalance(url, address);
    } else {
      throw new Error(`No balance available on chain ${chain.id}`);
    }
  }

  /*
   *  General balances for chain bases.
   */

  private async _getEthTokenBalance(
    url: string,
    network: string,
    tokenAddress: string,
    userAddress: string
  ): Promise<BN> {
    const provider = new Web3.providers.WebsocketProvider(url);
    let api;
    if(network === ChainNetwork.ERC20) {
      api = ERC20__factory.connect(tokenAddress, new providers.Web3Provider(provider as any));
    }
    else if(network === ChainNetwork.ERC721) {
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

  private async _getSplTokenBalance(cluster: solw3.Cluster, mint: string, user: string): Promise<BN> {
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

  private async _getCosmosTokenBalance(url: string, userAddress: string): Promise<BN> {
    /* also do network === ChainNetwork.NativeCosmos / Terra or ChainNetwork.CosmosNFT => should check NFTs */
    const tmClient = await Tendermint34Client.connect(url);

    const api = QueryClient.withExtensions(
      tmClient,
      setupBankExtension,
      setupStakingExtension,
    );

    try {
      const { params: { bondDenom } } = await api.staking.params();
      const denom = bondDenom;
      // TODO: include staking balance alongside bank balance?
      const bal = await api.bank.balance(userAddress, denom);
      return new BN(bal.amount);
    } catch (e) {
      throw new Error(`no balance found: ${e.message}`);
    }
  }

  /*
   *  Special balances for unique chain networks.
   */
  private async _getTerraTokenBalance(url: string, userAddress: string): Promise<BN> {
    if (!process.env.TERRA_SETTEN_PHOENIX_API_KEY) {
      throw new Error('No API key found for terra endpoint');
    }
    const api = new LCDClient({
      URL: `${url}/node_info?key=${process.env.TERRA_SETTEN_PHOENIX_API_KEY}`,
      chainID: 'phoenix-1',
    });

    try {
      // NOTE: terra.js staking module is incompatible with stargate queries
      const balResp = await api.bank.balance(userAddress);
      let balance: BN;

      // hardcoded token symbol is "uluna"
      if (balResp[0].get('uluna')) {
        balance = new BN(balResp[0].get('uluna').toString());
      } else {
        balance = new BN(0);
      }
      return balance;
    } catch (e) {
      throw new Error(`no balance found: ${e.message}`);
    }
  }

  private async _getRoninTokenBalance(address: string) {
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
    const node = await this.models.ChainNode.scope('withPrivateData').findOne({ where: { id: chain.chain_node_id } });
    if (!node || (chain.base === ChainBase.Ethereum && !node.eth_chain_id)) {
      throw new Error('Could not find chain node.');
    }

    // check the cache for the token balance
    const cacheKey = getKey(chain.base, node.eth_chain_id, chain.address, address);
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
    let contractAddress = chain.address;

    // if token is not in the database, then query against the Token list
    if (chain.base === ChainBase.Ethereum && chain.network !== ChainNetwork.AxieInfinity && !contractAddress) {
      const tokenMeta = await this.models.Token.findOne({
        where: {
          id: chain.address,
          chain_id: node.eth_chain_id,
        }
      });
      if (!tokenMeta?.address) throw new Error('unsupported token');
      contractAddress = tokenMeta.address;
    }

    const url = node.private_url || node.url;

    // will throw on invalid chain / other error
    const balance = await this._balanceProvider.getTokenBalance(address, chain, url, contractAddress);

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
