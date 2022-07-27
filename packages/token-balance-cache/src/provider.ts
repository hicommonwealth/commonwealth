import Web3 from 'web3';
import axios from 'axios';
import { StateMutabilityType, AbiType } from 'web3-utils';
import * as solw3 from '@solana/web3.js';
import {
  QueryClient,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';

import BN from 'bn.js';
import { providers } from 'ethers';

import { ERC20, ERC20__factory, ERC721, ERC721__factory } from 'common-common/src/eth/types';
import { BalanceType } from 'common-common/src/types';

import { ContractType } from './types';

export default class TokenBalanceProvider {
  public async getTokenBalance(
    address: string,
    balanceType: BalanceType,
    url: string,
    contractAddress?: string,
    contractType?: ContractType,
  ): Promise<BN> {
    // TODO: add near/sputnik
    if (balanceType === BalanceType.AxieInfinity) {
      return this._getRoninTokenBalance(address);
    } else if (balanceType === BalanceType.Terra) {
      return this._getTerraTokenBalance(url, address);
    } else if (contractAddress && contractType && balanceType === BalanceType.Ethereum) {
      return this._getEthTokenBalance(url, contractType, contractAddress, address);
    } else if (contractAddress && balanceType === BalanceType.Solana && contractType === 'spl-token') {
      return this._getSplTokenBalance(url as solw3.Cluster, contractAddress, address);
    } else if (balanceType === BalanceType.Cosmos) {
      return this._getCosmosTokenBalance(url, address);
    } else {
      throw new Error(`Unsupported chain`);
    }
  }

  /*
   *  General balances for chain bases.
   */

  private async _getEthTokenBalance(
    url: string,
    contractType: ContractType,
    tokenAddress: string,
    userAddress: string
  ): Promise<BN> {
    const provider = new Web3.providers.WebsocketProvider(url);
    let api: ERC20 | ERC721;
    if (contractType === 'erc20') {
      api = ERC20__factory.connect(tokenAddress, new providers.Web3Provider(provider as any));
    } else if (contractType === 'erc721') {
      api = ERC721__factory.connect(tokenAddress, new providers.Web3Provider(provider as any));
    } else {
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

  // TODO: this is causing a lot of errors because the url and the userAddress don't go together i.e. the url is for chihuahua and the userAddress is for osmosis (OSMO bech32 prefix)
  // This causes the following errors: Failed to query token balance: no balance found: Query failed with (18): rpc error: code = InvalidArgument desc = invalid address: invalid Bech32 prefix; expected chihuahua, got osmo: invalid request
  private async _getCosmosTokenBalance(url: string, userAddress: string): Promise<BN> {
    /* also do network === ChainNetwork.NativeCosmos / Terra or ChainNetwork.CosmosNFT => should check NFTs */
    const tmClient = await Tendermint34Client.connect(url);

    const api = QueryClient.withExtensions(
      tmClient,
      setupBankExtension,
      setupStakingExtension,
    );

    try {
      const { params } = await api.staking.params();
      const denom = params?.bondDenom;
      if (!denom) {
        throw new Error('Could not query staking params');
      }
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

    // make balance query
    const queryUrl = `${url}/cosmos/bank/v1beta1/balances/${
      userAddress
    }?key=${
      process.env.TERRA_SETTEN_PHOENIX_API_KEY
    }`;

    try {
      // NOTE: terra.js staking module is incompatible with stargate queries
      const balResp = await axios.get(queryUrl); // [ { denom: 'uluna', amount: '5000000' } ]
      const balances: Array<{ denom: string, amount: string }> = balResp?.data?.balances;
      let balance = new BN(0);
      if (balances?.length > 0) {
        const balanceObj = balances.find(({ denom }) => denom === 'uluna');
        if (balanceObj) {
          balance = new BN(balanceObj.amount);
        }
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
