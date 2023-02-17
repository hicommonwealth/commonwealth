import { validateOpts } from '../util/validateOpts';
import Web3 from 'web3';
import type { WebsocketProvider } from 'web3-core';
import type { BigNumber } from 'ethers';
import { providers } from 'ethers';
import type { ERC1155 } from 'common-common/src/eth/types';
import { ERC1155__factory } from 'common-common/src/eth/types';

import type { EthBPOpts, IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';

export default class Erc1155BalanceProvider extends BalanceProvider<
  ERC1155,
  EthBPOpts & { tokenId?: string }
> {
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
    opts: EthBPOpts & { tokenId?: string }
  ): string {
    return `${node.id}-${address}-${opts.tokenAddress}`;
  }

  public async getExternalProvider(
    node: IChainNode,
    opts: EthBPOpts & { tokenId?: string }
  ): Promise<ERC1155> {
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

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: EthBPOpts & { tokenId?: string }
  ): Promise<string> {
    const { tokenId } = opts;
    validateOpts(this.name, address, opts);
    const erc1155Api: ERC1155 = await this.getExternalProvider(node, opts);
    const balanceBigNum: BigNumber = await erc1155Api.balanceOf(
      address,
      tokenId
    );
    (
      (erc1155Api.provider as providers.Web3Provider)
        .provider as WebsocketProvider
    ).disconnect(1000, 'finished');
    return balanceBigNum.toString();
  }
}
