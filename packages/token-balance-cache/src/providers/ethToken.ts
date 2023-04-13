import type { EthBPOpts, IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';
import Web3 from 'web3';
import type { WebsocketProvider } from 'web3-core';
import Erc20BalanceProvider from './erc20';
import Erc721BalanceProvider from './erc721';
import Erc1155BalanceProvider from './erc1155';

export default class EthTokenBalanceProvider extends BalanceProvider<Web3> {
  public name = 'eth-token';
  public opts = {
    contractType: 'string?',
    tokenAddress: 'string?',
  };
  public validBases = [BalanceType.Ethereum];

  public getCacheKey(node: IChainNode, address: string): string {
    return `${node.id}-${address}-${'native'}`;
  }

  public async getExternalProvider(node: IChainNode): Promise<Web3> {
    const url = node.private_url || node.url;
    const provider = new Web3.providers.WebsocketProvider(url);
    return new Web3(provider);
  }

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: EthBPOpts
  ): Promise<string> {
    const { tokenAddress, contractType } = opts;
    const Web3 = (await import('web3')).default;
    if (!tokenAddress && !contractType) {
      if (!Web3.utils.isAddress(address)) {
        throw new Error('Invalid address');
      }
      const api = await this.getExternalProvider(node);
      const balance = await api.eth.getBalance(address);
      (api.currentProvider as WebsocketProvider).disconnect(1000, 'finished');
      // use native token if no args provided
      return balance;
    } else if(contractType == 'erc20'){
      return new Erc20BalanceProvider().getBalance(node, address, opts);
    }else if( contractType == 'erc721'){
      return new Erc721BalanceProvider().getBalance(node, address, opts)
    }else if(contractType == 'erc1155'){
      return new Erc1155BalanceProvider().getBalance(node, address, opts);
    }else{
      return "0"
    }
  }
}
