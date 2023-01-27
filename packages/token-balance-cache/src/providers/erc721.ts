import Web3 from 'web3';
import { BigNumber, providers } from 'ethers';
import type { ERC721 } from 'common-common/src/eth/types';
import { ERC721__factory } from 'common-common/src/eth/types';

import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';

type EthBPOpts = {
  tokenAddress?: string;
  contractType?: string;
};

export default class Erc721BalanceProvider extends BalanceProvider<EthBPOpts> {
  public name = 'erc721';
  // Added Token Id as String because it can be a BigNumber (uint256 on solidity)
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
    return `${node.id}-${address}-${opts.tokenAddress}`;
  }

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: EthBPOpts
  ): Promise<string> {
    const url = node.private_url || node.url;
    const { tokenAddress, contractType } = opts;
    if (!tokenAddress && !contractType) {
      throw new Error('Need Token Address and Contract Type');
    }
    if (!Web3.utils.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }
    if (!Web3.utils.isAddress(address)) {
      throw new Error('Invalid address');
    }

    const provider = new Web3.providers.WebsocketProvider(url);

    const erc721Api: ERC721 = ERC721__factory.connect(
      tokenAddress,
      new providers.Web3Provider(provider as any)
    );
    await erc721Api.deployed();
    return await this.fetchBalance(erc721Api, provider, address);
  }

  private async fetchBalance(
    api: ERC721,
    provider: any,
    address: string
  ): Promise<string> {
    const balanceBigNum: BigNumber = await api.balanceOf(address);
    provider.disconnect(1000, 'finished');
    return balanceBigNum.toString();
  }
}
