import { validateOpts } from '../util/validateOpts';
import type { EthBPOpts, IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';
import Web3 from 'web3';
import type { WebsocketProvider } from 'web3-core';

export default class evmBalanceProvider extends BalanceProvider<Web3> {
  public name = 'eth-token';
  public opts = {
    contractType: 'string?',
    tokenAddress: 'string?',
    tokenId: 'string?',
  };

  public validBases = [BalanceType.Ethereum];

  private balanceSelectors = { erc20: '0x70a08231', erc1155: '0x8f32d59b' };

  public getCacheKey(node: IChainNode, address: string): string {
    return this.opts.contractType
      ? `${node.id}-${address}-${this.opts.tokenAddress}`
      : `${node.id}-${address}-${'native'}`;
  }

  public async getExternalProvider(
    node: IChainNode,
    opts: EthBPOpts
  ): Promise<Web3> {
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
    }

    let calldata;
    if (contractType == 'erc20' || 'erc721') {
      validateOpts(address, opts);
      // function selector + calldata
      const data = api.eth.abi
        .encodeParameters(['address'], [address])
        .substring(2);
      //console.log(data)
      calldata = `${this.balanceSelectors.erc20}${data}`;
    } else if (contractType == '1155') {
      validateOpts(address, opts);
      calldata = `${this.balanceSelectors.erc1155}${api.eth.abi
        .encodeParameters(['address', 'uint256'], [address, opts.tokenId])
        .substring(2)}`;
    } else {
      throw new Error('Invalid Contract type');
    }
    const result = await api.eth.call({
      to: tokenAddress,
      data: calldata,
    });

    (api.currentProvider as WebsocketProvider).disconnect(1000, 'finished');
    return api.eth.abi.decodeParameter('uint256', result).toString();
  }
}
