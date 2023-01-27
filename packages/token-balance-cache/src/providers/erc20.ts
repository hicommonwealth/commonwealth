import Web3 from 'web3';
import { BigNumber, providers } from 'ethers';
import type { ERC20 } from 'common-common/src/eth/types';
import { ERC20__factory } from 'common-common/src/eth/types';

import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';

type EthBPOpts = {
  tokenAddress?: string;
  contractType?: string;
};

export default class Erc20BalanceProvider extends BalanceProvider<EthBPOpts> {
  public name = 'erc20';
  // Added Token Id as String because it can be a BigNumber (uint256 on solidity)
  public opts = {
    contractType: 'string?',
    tokenAddress: 'string?',
    tokenId: 'string?',
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
    const erc20Api: ERC20 = ERC20__factory.connect(
      tokenAddress,
      new providers.Web3Provider(provider as any)
    );
    await erc20Api.deployed();
    return await this.fetchBalance(erc20Api, provider, address);
  }

  private async fetchBalance(
    api: ERC20,
    provider: any,
    address: string
  ): Promise<string> {
    const balanceBigNum: BigNumber = await api.balanceOf(address);
    provider.disconnect(1000, 'finished');
    return balanceBigNum.toString();
  }
}
