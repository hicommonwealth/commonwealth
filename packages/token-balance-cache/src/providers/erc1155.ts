import Web3 from 'web3';
import { BigNumber, providers } from 'ethers';
import type { ERC1155 } from 'common-common/src/eth/types';
import { ERC1155__factory } from 'common-common/src/eth/types';

import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';

type EthBPOpts = {
  tokenAddress?: string;
  contractType?: string;
  tokenId?: string;
};

export default class Erc1155BalanceProvider extends BalanceProvider<EthBPOpts> {
  public name = 'erc1155';
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
    const { tokenAddress, contractType, tokenId } = opts;
    if (contractType != this.name) {
      throw new Error('Invalid Contract Type');
    }
    if (!tokenAddress) {
      throw new Error('Need Token Address');
    }
    if (!tokenId) {
      throw new Error('Token Id Required For ERC-1155');
    }
    if (!Web3.utils.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }
    if (!Web3.utils.isAddress(address)) {
      throw new Error('Invalid address');
    }
    const provider = new Web3.providers.WebsocketProvider(url);

    // eslint-disable-next-line no-case-declarations
    const erc1155Api: ERC1155 = ERC1155__factory.connect(
      tokenAddress,
      new providers.Web3Provider(provider as any)
    );
    await erc1155Api.deployed();
    return await this.fetchBalance(erc1155Api, provider, address, tokenId);
  }

  private async fetchBalance(
    api: ERC1155,
    provider: any,
    address: string,
    tokenId: string
  ): Promise<string> {
    const balanceBigNum: BigNumber = await api.balanceOf(address, tokenId);
    provider.disconnect(1000, 'finished');
    return balanceBigNum.toString();
  }
}
