import Web3 from 'web3';
import { BigNumber, providers } from 'ethers';
import type { ERC20, ERC721, ERC1155 } from 'common-common/src/eth/types';
import { ERC20__factory, ERC721__factory, ERC1155__factory } from 'common-common/src/eth/types';

import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';

type EthBPOpts = {
  tokenAddress?: string;
  contractType?: string;
  tokenId?: string;
};

export default class EthTokenBalanceProvider extends BalanceProvider<EthBPOpts> {
  public name = 'eth-token';
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
    return `${node.id}-${address}-${opts.tokenAddress || 'native'}`;
  }

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: EthBPOpts
  ): Promise<string> {
    const url = node.private_url || node.url;
    const { tokenAddress, contractType, tokenId } = opts;
    if (!tokenAddress && !contractType) {
      // use native token if no args provided
      const provider = new Web3.providers.WebsocketProvider(url);
      const web3 = new Web3(provider);
      return await this.fetchBalance(web3, provider, 'eth', address);
    }
    
    if (!Web3.utils.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }
    if (!Web3.utils.isAddress(address)) {
      throw new Error('Invalid address');
    }

    if (contractType === 'erc1155' && !tokenId) {
      throw new Error('Token Id Required For ERC-1155')
    }
    const provider = new Web3.providers.WebsocketProvider(url);
    switch (contractType) {
      case 'erc20':
        // eslint-disable-next-line no-case-declarations
        const erc20Api: ERC20 = ERC20__factory.connect(
          tokenAddress,
          new providers.Web3Provider(provider as any)
        );
        await erc20Api.deployed();
        return await this.fetchBalance(erc20Api, provider, contractType, address);

      case 'erc721':
        // eslint-disable-next-line no-case-declarations
        const erc721Api: ERC721 = ERC721__factory.connect(
          tokenAddress,
          new providers.Web3Provider(provider as any)
        );
        await erc721Api.deployed();
        return await this.fetchBalance(erc721Api, provider, contractType, address);
      
      case 'erc1155':
        // eslint-disable-next-line no-case-declarations
        const erc1155Api: ERC1155 = ERC1155__factory.connect(
          tokenAddress,
          new providers.Web3Provider(provider as any)
        )
        await erc1155Api.deployed();
        return await this.fetchBalance(erc1155Api, provider, contractType, address, tokenId);
      
      default:
        throw new Error('Invalid contract type');
    }
    
  }

  private async fetchBalance(api: any, provider: any, tokenType: string, address: string,  tokenId?: string): Promise<string> {
    if (tokenType === 'erc1155') {
      const balanceBigNum: BigNumber = await (api as ERC1155).balanceOf(address, tokenId);
      provider.disconnect(1000, 'finished');
      return balanceBigNum.toString();
    } else if (tokenType === 'erc20' || tokenType === 'erc721') {
      const balanceBigNum: BigNumber = await (api as ERC20 | ERC721).balanceOf(address);
      provider.disconnect(1000, 'finished');
      return balanceBigNum.toString();
    } else if (tokenType === 'eth') {
      const balance = await (api as Web3).eth.getBalance(address);
      provider.disconnect(1000, 'finished');
      return balance;
    }
  }
}
