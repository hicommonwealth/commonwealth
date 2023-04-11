import Web3 from 'web3';
import type { WebsocketProvider } from 'web3-core';
import type { BigNumber } from 'ethers';
import { providers } from 'ethers';
import type { ERC721 } from 'common-common/src/eth/types';
import { ERC721__factory } from 'common-common/src/eth/types';

import type { EthBPOpts, IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';
import { validateOpts } from '../util/validateOpts';

export default class Erc721BalanceProvider extends BalanceProvider<
  ERC721,
  EthBPOpts
> {
  public name = 'erc721';
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

  public async getExternalProvider(
    node: IChainNode,
    opts: EthBPOpts
  ): Promise<ERC721> {
    const url = node.private_url || node.url;
    const { tokenAddress } = opts;
    const provider = new Web3.providers.WebsocketProvider(url);

    const erc721Api = ERC721__factory.connect(
      tokenAddress,
      new providers.Web3Provider(provider)
    );
    await erc721Api.deployed();
    return erc721Api;
  }

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: EthBPOpts
  ): Promise<string> {
    validateOpts(this.name, address, opts);

    const erc721Api: ERC721 = await this.getExternalProvider(node, opts);

    const balanceBigNum: BigNumber = await erc721Api.balanceOf(address);
    (
      (erc721Api.provider as providers.Web3Provider)
        .provider as WebsocketProvider
    ).disconnect(1000, 'finished');
    return balanceBigNum.toString();
  }
}
