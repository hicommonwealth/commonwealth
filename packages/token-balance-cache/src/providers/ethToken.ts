/* eslint-disable @typescript-eslint/no-unused-vars */
import { BalanceType } from '@hicommonwealth/core';
import Web3 from 'web3';
import type { WebsocketProvider } from 'web3-core';
import type { EthBPOpts, IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { validateOpts } from '../util/validateOpts';

export default class evmBalanceProvider extends BalanceProvider<Web3> {
  public name = 'eth-token';
  public opts = {
    contractType: 'string?',
    tokenAddress: 'string?',
    tokenId: 'string?',
  };

  public validBases = [BalanceType.Ethereum];

  private balanceSelectors = { erc20: '0x70a08231', erc1155: '0x8f32d59b' };

  public getCacheKey(node: IChainNode, address: string, opts: any): string {
    return opts.contractType
      ? `${node.id}-${address}-${opts.tokenAddress}`
      : `${node.id}-${address}-${'native'}`;
  }

  public async getExternalProvider(
    node: IChainNode,
    opts: EthBPOpts,
  ): Promise<Web3> {
    const node_url = node.private_url || node.url;
    const provider =
      node_url.slice(0, 4) == 'http'
        ? new Web3.providers.HttpProvider(node_url)
        : new Web3.providers.WebsocketProvider(node_url);
    return new Web3(provider);
  }

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: EthBPOpts,
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
      if (api.currentProvider instanceof Web3.providers.WebsocketProvider)
        (api.currentProvider as WebsocketProvider).disconnect(1000, 'finished');
      // use native token if no args provided
      return balance;
    }

    let calldata;
    if (contractType == 'erc20' || contractType == 'erc721') {
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
    if (api.currentProvider instanceof Web3.providers.WebsocketProvider)
      (api.currentProvider as WebsocketProvider).disconnect(1000, 'finished');
    return api.eth.abi.decodeParameter('uint256', result).toString();
  }
}
