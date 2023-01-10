import Web3 from 'web3';
import { providers } from 'ethers';
import type {
  ERC20,
  ERC721} from 'common-common/src/eth/types';
import {
  ERC20__factory,
  ERC721__factory,
} from 'common-common/src/eth/types';

import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';

type EthBPOpts = {
  tokenAddress?: string;
  contractType?: string;
};

export default class EthTokenBalanceProvider extends BalanceProvider<EthBPOpts> {
  public name = 'eth-token';
  public opts = {
    contractType: 'string?',
    tokenAddress: 'string?',
  };
  public validBases = [BalanceType.Ethereum];

  public getCacheKey(
    node: IChainNode,
    address: string,
    opts: EthBPOpts
  ): string {
    return `${node.id}-${address}-${opts.tokenAddress || 'native'}`;
  }

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: EthBPOpts
  ): Promise<string> {
    const url = node.private_url || node.url;
    const { tokenAddress, contractType } = opts;
    if (!tokenAddress && !contractType) {
      // use native token if no args provided
      const provider = new Web3.providers.WebsocketProvider(url);
      const web3 = new Web3(provider);
      const balance = await web3.eth.getBalance(address);
      provider.disconnect(1000, 'finished');
      return balance;
    }
    if (contractType !== 'erc20' && contractType !== 'erc721') {
      throw new Error('Invalid contract type');
    }
    if (!Web3.utils.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }
    if (!Web3.utils.isAddress(address)) {
      throw new Error('Invalid address');
    }

    const provider = new Web3.providers.WebsocketProvider(url);
    let api: ERC20 | ERC721;
    if (contractType === 'erc20') {
      api = ERC20__factory.connect(
        tokenAddress,
        new providers.Web3Provider(provider as any)
      );
    } else if (contractType === 'erc721') {
      api = ERC721__factory.connect(
        tokenAddress,
        new providers.Web3Provider(provider as any)
      );
    } else {
      throw new Error('Invalid token chain network');
    }
    await api.deployed();
    const balanceBigNum = await api.balanceOf(address);
    provider.disconnect(1000, 'finished');
    return balanceBigNum.toString();
  }
}
