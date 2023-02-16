import { validateOpts } from '../util/validateOpts';
import Web3 from 'web3';
import type { WebsocketProvider } from 'web3-core';
import type { ERC20 } from 'common-common/src/eth/types';
import { ERC20__factory } from 'common-common/src/eth/types';
import type { BigNumber } from 'ethers';
import { providers } from 'ethers';
import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';
import { BalanceType } from 'common-common/src/types';

type EthBPOpts = {
  tokenAddress?: string;
  contractType?: string;
};

export default class Erc20BalanceProvider extends BalanceProvider<
  ERC20,
  EthBPOpts
> {
  public name = 'erc20';
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
  ): Promise<ERC20> {
    const url = node.private_url || node.url;
    const { tokenAddress } = opts;
    const provider = new Web3.providers.WebsocketProvider(url);

    const erc20Api = ERC20__factory.connect(
      tokenAddress,
      new providers.Web3Provider(provider)
    );
    await erc20Api.deployed();
    return erc20Api;
  }

  public async getBalance(
    node: IChainNode,
    address: string,
    opts: EthBPOpts
  ): Promise<string> {
    validateOpts(this.name, address, opts);

    const erc20Api: ERC20 = await this.getExternalProvider(node, opts);
    const balanceBigNum: BigNumber = await erc20Api.balanceOf(address);

    (
      (erc20Api.provider as providers.Web3Provider)
        .provider as WebsocketProvider
    ).disconnect(1000, 'finished');
    return balanceBigNum.toString();
  }
}
