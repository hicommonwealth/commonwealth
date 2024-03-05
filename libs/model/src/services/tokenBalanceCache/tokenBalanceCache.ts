import { BalanceSourceType, logger, stats } from '@hicommonwealth/core';
import { getCosmosBalances, getEvmBalances } from './providers';
import {
  Balances,
  GetBalancesOptions,
  GetCosmosBalancesOptions,
  GetErcBalanceOptions,
  GetEvmBalancesOptions,
} from './types';

const log = logger().getLogger(__filename);

/**
 * This is the main function through which all balances should be fetched.
 * This function supports all balance sources and is fully compatible with Redis caching.
 */
export async function getBalances(
  options: GetBalancesOptions,
  ttl?: number,
): Promise<Balances> {
  if (options.addresses.length === 0) return {};

  let balances: Balances = {};

  try {
    if (
      options.balanceSourceType === BalanceSourceType.CosmosNative ||
      options.balanceSourceType === BalanceSourceType.CW721
    ) {
      balances = await getCosmosBalances(options, ttl);
    } else {
      balances = await getEvmBalances(options, ttl);
    }
  } catch (e) {
    const msg = `Failed to fetch balance(s) for ${options.addresses.length}`;
    log.error(msg, e instanceof Error ? e : undefined, {
      addresses: options.addresses.slice(0, 5),
      contractAddress: (options as GetErcBalanceOptions).sourceOptions
        .contractAddress,
      evmChainId: (options as GetEvmBalancesOptions).sourceOptions.evmChainId,
      cosmosChainId: (options as GetCosmosBalancesOptions).sourceOptions
        .cosmosChainId,
    });
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
