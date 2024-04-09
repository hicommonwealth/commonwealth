import { BalanceSourceType, stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { getCosmosBalances, getEvmBalances } from './providers';
import {
  Balances,
  GetBalancesOptions,
  GetCosmosBalancesOptions,
  GetErcBalanceOptions,
  GetEvmBalancesOptions,
} from './types';

const log = logger(import.meta.filename);

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
      options.balanceSourceType === BalanceSourceType.CW20 ||
      options.balanceSourceType === BalanceSourceType.CW721
    ) {
      balances = await getCosmosBalances(options, ttl);
    } else {
      balances = await getEvmBalances(options, ttl);
    }
  } catch (e) {
    const chainId =
      (options as GetEvmBalancesOptions).sourceOptions.evmChainId ||
      (options as GetCosmosBalancesOptions).sourceOptions.cosmosChainId;
    const contractAddress = (options as GetErcBalanceOptions).sourceOptions
      .contractAddress;
    const msg =
      `Failed to fetch balance(s) for ${options.addresses.length} address(es)` +
      `on chain ${chainId}${contractAddress && ' for contract '}${
        contractAddress || ''
      }`;

    log.error(msg, e instanceof Error ? e : undefined, {
      fingerprint: `TBC: ${chainId} - ${contractAddress}`,
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
