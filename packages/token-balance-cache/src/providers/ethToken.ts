import BN from 'bn.js';
import Web3 from 'web3';
import { providers } from 'ethers';

import { ERC20, ERC20__factory, ERC721, ERC721__factory } from 'common-common/src/eth/types';

import { BalanceProviderT, ContractType, ChainNodeT } from '../types';

export type EthTokenOpts = {
  tokenAddress: string;
  contractType: ContractType;
};

const BalanceProvider: BalanceProviderT<EthTokenOpts> = {
  name: 'eth-token',
  getCacheKey: (node: ChainNodeT, address: string, { tokenAddress }) => {
    return `${node.id}-${address}-${tokenAddress}`;
  },
  getBalance: async (node: ChainNodeT, userAddress: string, { tokenAddress, contractType }) => {
    const url = node.private_url || node.url;
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
  },
};

export default BalanceProvider;
