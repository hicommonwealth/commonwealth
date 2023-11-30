import { factory, formatFilename } from 'common-common/src/logging';
import { RedisCache } from 'common-common/src/redisCache';
import { RedisNamespaces } from 'common-common/src/types';
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

    if (options.balanceSourceType === BalanceSourceType.CosmosNative) {
      balances = await this.getCosmosBalances(options);
    } else {
      balances = await this.getEvmBalances(options);
    }

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
    const validatedAddresses: string[] = [];
    for (const address of options.addresses) {
      if (Web3.utils.isAddress(address)) {
        validatedAddresses.push(address);
      } else {
        log.info(`Skipping non-address ${address}`);
      }
    }

    if (validatedAddresses.length === 0) return {};

    let balances: Balances = {};
    if (!options.cacheRefresh) {
      const result = await this.redis.getKeys(
        RedisNamespaces.Token_Balance,
        validatedAddresses.map((address) =>
          this.buildCacheKey(options, address),
        ),
      );
      if (result !== false) {
        for (const [address, balance] of Object.entries(result)) {
          balances[address] = balance as string;
          const addressIndex = validatedAddresses.indexOf(address);
          validatedAddresses[addressIndex] =
            validatedAddresses[validatedAddresses.length - 1];
          validatedAddresses.pop();
        }
      }
    }

    const chainNode = await this.models.ChainNode.scope(
      'withPrivateData',
    ).findOne({
      where: {
        eth_chain_id: options.sourceOptions.evmChainId,
      },
    });

    let newBalances: Balances = {};
    switch (options.balanceSourceType) {
      case BalanceSourceType.ETHNative:
        newBalances = await __getEthBalances.call(this, {
          chainNode,
          addresses: validatedAddresses,
        });
        break;
      case BalanceSourceType.ERC20:
        newBalances = await __getErc20Balances.call(this, {
          chainNode,
          addresses: validatedAddresses,
          contractAddress: options.sourceOptions.contractAddress,
        });
        break;
      case BalanceSourceType.ERC721:
        newBalances = await __getErc721Balances.call(this, {
          chainNode,
          addresses: validatedAddresses,
          contractAddress: options.sourceOptions.contractAddress,
        });
        break;
      case BalanceSourceType.ERC1155:
        newBalances = await __getErc1155Balances.call(this, {
          chainNode,
          addresses: validatedAddresses,
          contractAddress: options.sourceOptions.contractAddress,
          tokenId: options.sourceOptions.tokenId,
        });
        break;
    }

    await this.cacheBalances(options, newBalances);

    return { ...newBalances, ...balances };
  }

  private async cacheBalances(options: GetBalancesOptions, balances: Balances) {
    if (Object.keys(balances).length > 0) {
      await this.redis.setKeys(
        RedisNamespaces.Token_Balance,
        Object.keys(balances).reduce((result, address) => {
          const transformedKey = this.buildCacheKey(options, address);
          result[transformedKey] = balances[address];
          return result;
        }, {}),
        120,
        false,
      );
    }
  }

  private buildCacheKey(options: GetBalancesOptions, address: string): string {
    switch (options.balanceSourceType) {
      case BalanceSourceType.ETHNative:
        return `${options.sourceOptions.evmChainId}_${address}`;
      case BalanceSourceType.ERC20:
      case BalanceSourceType.ERC721:
        return (
          `${options.sourceOptions.evmChainId}_` +
          `${options.sourceOptions.contractAddress}_${address}`
        );
      case BalanceSourceType.ERC1155:
        return (
          `${options.sourceOptions.evmChainId}_` +
          `${options.sourceOptions.contractAddress}_` +
          `${options.sourceOptions.tokenId}_${address}`
        );
      case BalanceSourceType.CosmosNative:
        return `${options.sourceOptions.cosmosChainId}_${address}`;
    }
  }
}
