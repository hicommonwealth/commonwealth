import BN from 'bn.js';
import Web3 from 'web3';
import { providers } from 'ethers';
import { StateMutabilityType, AbiType } from 'web3-utils';
import { ERC20__factory } from 'common-common/src/eth/types';

import { BalanceProviderT, ChainNodeT } from '../types';

export type RoninTokenOpts = {};

const BalanceProvider: BalanceProviderT<RoninTokenOpts> = {
  name: 'ronin-token',
  getCacheKey: (node: ChainNodeT, address: string) => {
    return `${node.id}-${address}`;
  },
  getBalance: async (node: ChainNodeT, address: string) => {
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
  },
};

export default BalanceProvider;
