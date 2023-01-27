import Web3 from 'web3';

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
    return `${node.id}-${address}-${'native'}`;
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
      return await this.fetchBalance(web3, provider, address);
    }
  }

  private async fetchBalance(
    api: Web3,
    provider: any,
    address: string
  ): Promise<string> {
    const balance = await api.eth.getBalance(address);
    provider.disconnect(1000, 'finished');
    return balance;
  }
}
