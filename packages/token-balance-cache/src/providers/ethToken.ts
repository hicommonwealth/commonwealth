import Web3 from 'web3';
import { providers } from 'ethers';
import { ERC20, ERC20__factory, ERC721, ERC721__factory } from 'common-common/src/eth/types';

import { BalanceProvider, IChainNode } from "../types";

type EthBPOpts = {
  tokenAddress: string;
  contractType: string;
};

export default class EthTokenBalanceProvider extends BalanceProvider<EthBPOpts> {
  public name = 'eth-token';
  public opts = {
    contractType: 'string',
    tokenAddress: 'string',
  };

  public getCacheKey(node: IChainNode, address: string, opts: EthBPOpts): string {
    return `${node.id}-${address}-${opts.tokenAddress}`;
  }

  public async getBalance(node: IChainNode, address: string, opts: EthBPOpts): Promise<string> {
    const url = node.private_url || node.url;
    const { tokenAddress, contractType } = opts;
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
    const balanceBigNum = await api.balanceOf(address);
    provider.disconnect(1000, 'finished');
    return balanceBigNum.toString()
  }
}
