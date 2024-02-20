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
