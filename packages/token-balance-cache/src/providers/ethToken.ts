import { validateOpts } from '../util/validateOpts';
import type { EthBPOpts, IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';
import Web3 from 'web3';
import type { WebsocketProvider } from 'web3-core';
import {
  ERC1155,
  ERC1155__factory,
  ERC20,
  ERC20__factory,
  ERC721,
  ERC721__factory,
} from 'common-common/src/eth/types';
import { BigNumber, providers } from 'ethers';

export default class evmBalanceProvider extends BalanceProvider<Web3> {
  public name = 'eth-token';
  public opts = {
    contractType: 'string?',
    tokenAddress: 'string?',
    tokenId: 'string?',
  };

  public validBases = [BalanceType.Ethereum];

  public getCacheKey(node: IChainNode, address: string): string {
    return this.opts.contractType
      ? `${node.id}-${address}-${this.opts.tokenAddress}`
      : `${node.id}-${address}-${'native'}`;
  }

  public async getExternalProvider(
    node: IChainNode,
    opts: EthBPOpts
  ): Promise<any> {
    const url = node.private_url || node.url;
    const provider = new Web3.providers.WebsocketProvider(url);
    if (!opts.contractType) {
      return new Web3(provider);
    }

    switch (opts.contractType) {
      case 'erc20': {
        const erc20Api = ERC20__factory.connect(
          opts.tokenAddress,
          new providers.Web3Provider(provider)
        );
        await erc20Api.deployed();
        return erc20Api;
      }
      case 'erc721': {
        const provider = new Web3.providers.WebsocketProvider(url);

        const erc721Api = ERC721__factory.connect(
          opts.tokenAddress,
          new providers.Web3Provider(provider)
        );
        await erc721Api.deployed();
        return erc721Api;
      }
      case 'erc1155': {
        const url = node.private_url || node.url;
        const { tokenAddress } = opts;
        const provider = new Web3.providers.WebsocketProvider(url);

        const erc1155Api: ERC1155 = ERC1155__factory.connect(
          tokenAddress,
          new providers.Web3Provider(provider)
        );
        await erc1155Api.deployed();
        return erc1155Api;
      }
      default: {
        throw Error('Not a valid contract type');
      }
    }
  }

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: EthBPOpts
  ): Promise<string> {
    const { tokenAddress, contractType } = opts;
    const Web3 = (await import('web3')).default;
    const api = await this.getExternalProvider(node, opts);
    if (!tokenAddress && !contractType) {
      // Native Token flow
      if (!Web3.utils.isAddress(address)) {
        throw new Error('Invalid address');
      }
      const balance = await api.eth.getBalance(address);
      (api.currentProvider as WebsocketProvider).disconnect(1000, 'finished');
      // use native token if no args provided
      return balance;
    } else if (contractType == 'erc20') {
      validateOpts(address, opts);
      const erc20Api: ERC20 = api;
      const balanceBigNum: BigNumber = await erc20Api.balanceOf(address);
      (
        (erc20Api.provider as providers.Web3Provider)
          .provider as WebsocketProvider
      ).disconnect(1000, 'finished');
      return balanceBigNum.toString();
    } else if (contractType == 'erc721') {
      validateOpts(address, opts);

      const erc721Api: ERC721 = api;

      const balanceBigNum: BigNumber = await erc721Api.balanceOf(address);
      (
        (erc721Api.provider as providers.Web3Provider)
          .provider as WebsocketProvider
      ).disconnect(1000, 'finished');
      return balanceBigNum.toString();
    } else if (contractType == 'erc1155') {
      validateOpts(address, opts);
      const erc1155Api: ERC1155 = api;
      const balanceBigNum: BigNumber = await erc1155Api.balanceOf(
        address,
        opts.tokenId
      );
      (
        (erc1155Api.provider as providers.Web3Provider)
          .provider as WebsocketProvider
      ).disconnect(1000, 'finished');
      return balanceBigNum.toString();
    } // will have thrown error in getExternalProvider if code reaches this step
  }
}
