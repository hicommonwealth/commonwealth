import { factory, formatFilename } from 'common-common/src/logging';
import { RedisCache } from 'common-common/src/redisCache';
import Web3 from 'web3';
import { DB } from '../../models';
import { BalanceSourceType } from '../requirementsModule/requirementsTypes';
import { __getCosmosNativeBalances } from './providers/get_cosmos_balances';
import { __getErc1155Balances } from './providers/get_erc1155_balances';
import { __getErc20Balances } from './providers/get_erc20_balances';
import { __getErc721Balances } from './providers/get_erc721_balances';
import { __getEthBalances } from './providers/get_eth_balances';
import {
  Balances,
  GetBalancesOptions,
  GetCosmosBalancesOptions,
  GetEvmBalancesOptions,
} from './types';

const log = factory.getLogger(formatFilename(__filename));

export class TokenBalanceCache {
  constructor(public models: DB, public redis: RedisCache) {}

  /**
   * This is the main function through which all balances should be fetched.
   * This function supports all balance sources and is fully compatible with Redis caching.
   */
  public async getBalances(options: GetBalancesOptions): Promise<Balances> {
    if (options.addresses.length === 0) return {};

    let balances: Balances;

    // fetch from cache

    // fetch missing from cache
    if (options.balanceSourceType === BalanceSourceType.CosmosNative) {
      balances = await this.getCosmosBalances(options);
    } else {
      balances = await this.getEvmBalances(options);
    }

    // update cache

    // return
    return balances;
  }

  private async getCosmosBalances(options: GetCosmosBalancesOptions) {
    const chainNode = await this.models.ChainNode.scope(
      'withPrivateData',
    ).findOne({
      where: {
        cosmos_chain_id: options.sourceOptions.cosmosChainId,
      },
    });

    return await __getCosmosNativeBalances.call(this, {
      chainNode,
      addresses: options.addresses,
    });
  }

  private async getEvmBalances(options: GetEvmBalancesOptions) {
    const validatedAddress: string[] = [];
    for (const address of options.addresses) {
      if (Web3.utils.isAddress(address)) {
        validatedAddress.push(address);
      } else {
        log.info(`Skipping non-address ${address}`);
      }
    }

    if (validatedAddress.length === 0) return {};

    const chainNode = await this.models.ChainNode.scope(
      'withPrivateData',
    ).findOne({
      where: {
        eth_chain_id: options.sourceOptions.evmChainId,
      },
    });

    switch (options.balanceSourceType) {
      case BalanceSourceType.ETHNative:
        return await __getEthBalances.call(this, {
          chainNode,
          addresses: validatedAddress,
        });
      case BalanceSourceType.ERC20:
        return await __getErc20Balances.call(this, {
          chainNode,
          addresses: validatedAddress,
          contractAddress: options.sourceOptions.contractAddress,
        });
      case BalanceSourceType.ERC721:
        return await __getErc721Balances.call(this, {
          chainNode,
          addresses: validatedAddress,
          contractAddress: options.sourceOptions.contractAddress,
        });
      case BalanceSourceType.ERC1155:
        return await __getErc1155Balances.call(this, {
          chainNode,
          addresses: validatedAddress,
          contractAddress: options.sourceOptions.contractAddress,
          tokenId: options.sourceOptions.tokenId,
        });
    }
  }
}
