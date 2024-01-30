import { fromBech32, toBech32 } from '@cosmjs/encoding';
import {
  BalanceSourceType,
  CacheNamespaces,
  cache,
  logger,
  stats,
} from '@hicommonwealth/core';
import Web3 from 'web3';
import { DB } from '../../models';
import { __getCosmosNativeBalances } from './providers/get_cosmos_balances';
import { __getCw721Balances } from './providers/get_cw721_balances';
import { __getErc1155Balances } from './providers/get_erc1155_balances';
import { __getErc20Balances } from './providers/get_erc20_balances';
import { __getErc721Balances } from './providers/get_erc721_balances';
import { __getEthBalances } from './providers/get_eth_balances';
import {
  Balances,
  GetBalancesOptions,
  GetCosmosBalancesOptions,
  GetErcBalanceOptions,
  GetEvmBalancesOptions,
} from './types';

const log = logger().getLogger(__filename);

export class TokenBalanceCache {
  constructor(public models: DB, public balanceTTL = 300) {}

  /**
   * This is the main function through which all balances should be fetched.
   * This function supports all balance sources and is fully compatible with Redis caching.
   */
  public async getBalances(options: GetBalancesOptions): Promise<Balances> {
    if (options.addresses.length === 0) return {};

    let balances: Balances = {};

    try {
      if (
        options.balanceSourceType === BalanceSourceType.CosmosNative ||
        options.balanceSourceType === BalanceSourceType.CW721
      ) {
        balances = await this.getCosmosBalances(options);
      } else {
        balances = await this.getEvmBalances(options);
      }
    } catch (e) {
      let chainId: string;
      if ((options as GetEvmBalancesOptions).sourceOptions.evmChainId) {
        chainId = `evm chain id ${
          (options as GetEvmBalancesOptions).sourceOptions.evmChainId
        }`;
      } else {
        chainId = `cosmos chain id ${
          (options as GetCosmosBalancesOptions).sourceOptions.cosmosChainId
        }`;
      }

      let contractAddress: string = '';
      if ((options as GetErcBalanceOptions).sourceOptions.contractAddress) {
        contractAddress = ` for contract address ${
          (options as GetErcBalanceOptions).sourceOptions.contractAddress
        }`;
      }
      const msg =
        `Failed to fetch balance(s) for ${options.addresses.length}` +
        ` address(es) on ${chainId}${contractAddress}`;
      log.error(msg, e instanceof Error ? e : undefined);
    }

    stats().incrementBy(
      'tbc.successful.balance.fetch',
      Object.keys(balances).length,
      {
        balance_source_type: options.balanceSourceType,
      },
    );
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

    if (!chainNode) {
      const msg = `ChainNode with cosmos_chain_id ${options.sourceOptions.cosmosChainId} does not exist`;
      log.error(msg);
      return {};
    }

    // maps an encoded address to a decoded address to avoid having to decode
    // all addresses twice before returning
    const addressMap: { [encodedAddress: string]: string } = {};
    for (const address of options.addresses) {
      try {
        const { data } = fromBech32(address);
        const encodedAddress = toBech32(chainNode.bech32!, data);
        addressMap[encodedAddress] = address;
      } catch (e) {
        if (address != '0xdiscordbot') {
          log.error(
            `Skipping address: ${address}`,
            e instanceof Error ? e : undefined,
          );
        }
      }
    }

    const validatedAddresses = Object.keys(addressMap);
    if (validatedAddresses.length === 0) return {};

    const cachedBalances = await this.getCachedBalances(
      options,
      validatedAddresses,
    );

    let freshBalances = {};
    switch (options.balanceSourceType) {
      case BalanceSourceType.CosmosNative:
        freshBalances = await __getCosmosNativeBalances.call(this, {
          chainNode,
          addresses: validatedAddresses,
          batchSize: options.batchSize,
        });
        break;
      case BalanceSourceType.CW721:
        freshBalances = await __getCw721Balances.call(this, {
          chainNode,
          addresses: validatedAddresses,
          contractAddress: options.sourceOptions.contractAddress,
          batchSize: options.batchSize,
        });
        break;
    }

    await this.cacheBalances(options, freshBalances);

    // this function facilitates reverting addresses to the format that was requested
    // e.g. you could request osmosis balance and give a juno address ->
    // to fetch the osmosis balance we convert juno address to osmosis address
    // and this function undoes that change
    const transformAddresses = (balances: Balances): Balances => {
      const result: Balances = {};
      for (const [address, balance] of Object.entries(balances)) {
        result[addressMap[address]] = balance;
      }
      return result;
    };

    // map to decoded addresses rather than the generated encoded addresses
    const transformedFreshBalances = transformAddresses(freshBalances);
    const transformedCachedBalances = transformAddresses(cachedBalances);

    return { ...transformedFreshBalances, ...transformedCachedBalances };
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

    const cachedBalances = await this.getCachedBalances(
      options,
      validatedAddresses,
    );

    const chainNode = await this.models.ChainNode.scope(
      'withPrivateData',
    ).findOne({
      where: {
        eth_chain_id: options.sourceOptions.evmChainId,
      },
    });

    if (!chainNode) {
      const msg = `ChainNode with eth_chain_id ${options.sourceOptions.evmChainId} does not exist`;
      log.error(msg);
      return {};
    }

    let freshBalances: Balances = {};
    switch (options.balanceSourceType) {
      case BalanceSourceType.ETHNative:
        freshBalances = await __getEthBalances.call(this, {
          chainNode,
          addresses: validatedAddresses,
          batchSize: options.batchSize,
        });
        break;
      case BalanceSourceType.ERC20:
        freshBalances = await __getErc20Balances.call(this, {
          chainNode,
          addresses: validatedAddresses,
          contractAddress: options.sourceOptions.contractAddress,
          batchSize: options.batchSize,
        });
        break;
      case BalanceSourceType.ERC721:
        freshBalances = await __getErc721Balances.call(this, {
          chainNode,
          addresses: validatedAddresses,
          contractAddress: options.sourceOptions.contractAddress,
          batchSize: options.batchSize,
        });
        break;
      case BalanceSourceType.ERC1155:
        freshBalances = await __getErc1155Balances.call(this, {
          chainNode,
          addresses: validatedAddresses,
          contractAddress: options.sourceOptions.contractAddress,
          tokenId: options.sourceOptions.tokenId,
          batchSize: options.batchSize,
        });
        break;
    }

    await this.cacheBalances(options, freshBalances);

    return { ...freshBalances, ...cachedBalances };
  }

  /**
   * This function retrieves cached balances and modifies (in-place) the given addresses array
   * to remove addresses whose balance was cached. This means that after executing this function,
   * the addresses array only contains addresses whose balance was not cached.
   */
  private async getCachedBalances(
    options: GetBalancesOptions,
    addresses: string[],
  ): Promise<Balances> {
    const balances: Balances = {};
    if (!options.cacheRefresh) {
      const result = await cache().getKeys(
        CacheNamespaces.Token_Balance,
        addresses.map((address) => this.buildCacheKey(options, address)),
      );
      if (result !== false) {
        for (const [key, balance] of Object.entries(result)) {
          const address = this.getAddressFromCacheKey(key);
          balances[address] = balance as string;
          const addressIndex = addresses.indexOf(address);
          addresses[addressIndex] = addresses[addresses.length - 1];
          addresses.pop();
        }
      }
    }
    return balances;
  }

  private async cacheBalances(options: GetBalancesOptions, balances: Balances) {
    if (Object.keys(balances).length > 0) {
      await cache().setKeys(
        CacheNamespaces.Token_Balance,
        Object.keys(balances).reduce((result, address) => {
          const transformedKey = this.buildCacheKey(options, address);
          result[transformedKey] = balances[address];
          return result;
        }, {} as Balances),
        this.balanceTTL,
        false,
      );
    }
  }

  /**
   * This function builds the cache key for a specific balance on any chain, contract, or token.
   * WARNING: address MUST always be the last value in the key so that we can easily derive
   * a wallet address from the cache key.
   */
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
      case BalanceSourceType.CW721:
        return (
          `${options.sourceOptions.cosmosChainId}_` +
          `${options.sourceOptions.contractAddress}_${address}`
        );
    }
  }

  private getAddressFromCacheKey(key: string): string {
    return key.substring(key.lastIndexOf('_') + 1);
  }
}
