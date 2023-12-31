/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ERC20 } from '@hicommonwealth/chains';
import { ERC20__factory } from '@hicommonwealth/chains';
import { BalanceType } from '@hicommonwealth/core';
import BN from 'bn.js';
import { providers } from 'ethers';
import Web3 from 'web3';
import type { HttpProvider } from 'web3-core';
import type { Contract } from 'web3-eth-contract';
import type { AbiType, StateMutabilityType } from 'web3-utils';
import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';

export default class RoninBalanceProvider extends BalanceProvider<
  [ERC20, Contract]
> {
  public name = 'ronin';
  public opts = {};
  public validBases = [BalanceType.AxieInfinity];
  // TODO graceful handling when the provider breaks or throw error
  public async getExternalProvider(
    node: IChainNode,
  ): Promise<[api: ERC20, stakingContract: Contract]> {
    // TODO: make configurable
    const rpcUrl = 'https://api.roninchain.com/rpc';
    const provider = new Web3.providers.HttpProvider(rpcUrl);
    const web3 = new Web3(provider);
    const axsAddress = '0x97a9107c1793bc407d6f527b77e7fff4d812bece';
    const axsStakingPoolAddress = '05b0bb3c1c320b280501b86706c3551995bc8571';
    const axsApi = ERC20__factory.connect(
      axsAddress,
      new providers.Web3Provider(provider as any),
    );
    await axsApi.deployed();

    const axsStakingAbi = [
      {
        constant: true,
        inputs: [
          {
            internalType: 'address',
            name: '_user',
            type: 'address',
          },
        ],
        name: 'getStakingAmount',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view' as StateMutabilityType,
        type: 'function' as AbiType,
      },
    ];
    const axsStakingPoolContract = new web3.eth.Contract(
      axsStakingAbi,
      axsStakingPoolAddress,
    );

    return [axsApi, axsStakingPoolContract];
  }

  public async getBalance(node: IChainNode, address: string): Promise<string> {
    if (!Web3.utils.isAddress(address)) {
      throw new Error('Invalid address');
    }

    const [axsApi, axsStakingPoolContract] = await this.getExternalProvider(
      node,
    );

    const axsBalanceBigNum = await axsApi.balanceOf(address);

    const stakingPoolBalance = await axsStakingPoolContract.methods
      .getStakingAmount(address)
      .call();

    (
      (axsApi.provider as providers.Web3Provider).provider as HttpProvider
    ).disconnect();
    return new BN(axsBalanceBigNum.toString())
      .add(new BN(stakingPoolBalance.toString()))
      .toString();
  }
}
