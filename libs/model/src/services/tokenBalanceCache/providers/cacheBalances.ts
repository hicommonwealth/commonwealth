import {
  BalanceSourceType,
  CacheNamespaces,
  cache,
} from '@hicommonwealth/core';
import { Balances, GetBalancesOptions } from '../types';

const balanceTTL = process.env.TBC_BALANCE_TTL_SECONDS
  ? parseInt(process.env.TBC_BALANCE_TTL_SECONDS, 10)
  : 300;

/**
 * This function retrieves cached balances and modifies (in-place) the given addresses array
 * to remove addresses whose balance was cached. This means that after executing this function,
 * the addresses array only contains addresses whose balance was not cached.
 */
export async function getCachedBalances(
  options: GetBalancesOptions,
  addresses: string[],
): Promise<Balances> {
  const balances: Balances = {};
  if (!options.cacheRefresh) {
    const result = await cache().getKeys(
      CacheNamespaces.Token_Balance,
      addresses.map((address) => buildCacheKey(options, address)),
    );
    if (result) {
      for (const [key, balance] of Object.entries(result)) {
        const address = getAddressFromCacheKey(key);
        balances[address] = balance as string;
        const addressIndex = addresses.indexOf(address);
        addresses[addressIndex] = addresses[addresses.length - 1];
        addresses.pop();
      }
    }
  }
  return balances;
}

export async function cacheBalances(
  options: GetBalancesOptions,
  balances: Balances,
  ttl?: number,
) {
  if (Object.keys(balances).length > 0) {
    await cache().setKeys(
      CacheNamespaces.Token_Balance,
      Object.keys(balances).reduce((result, address) => {
        const transformedKey = buildCacheKey(options, address);
        result[transformedKey] = balances[address];
        return result;
      }, {} as Balances),
      ttl ?? balanceTTL,
      false,
    );
  }
}

/**
 * This function builds the cache key for a specific balance on any chain, contract, or token.
 * WARNING: address MUST always be the last value in the key so that we can easily derive
 * a wallet address from the cache key.
 */
function buildCacheKey(options: GetBalancesOptions, address: string): string {
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
    case BalanceSourceType.CW20:
    case BalanceSourceType.CW721:
      return (
        `${options.sourceOptions.cosmosChainId}_` +
        `${options.sourceOptions.contractAddress}_${address}`
      );
  }
}

function getAddressFromCacheKey(key: string): string {
  return key.substring(key.lastIndexOf('_') + 1);
}
