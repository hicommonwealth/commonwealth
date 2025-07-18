import { logger, stats } from '@hicommonwealth/core';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { getCosmosBalances, getEvmBalances } from './providers';
import { getSolanaBalances } from './providers/getSolanaBalances';
import { getSuiBalances } from './providers/getSuiBalances';
import {
  Balances,
  GetBalancesOptions,
  GetCosmosBalancesOptions,
  GetErcBalanceOptions,
  GetEvmBalancesOptions,
  GetSPLBalancesOptions,
  GetSuiNativeBalanceOptions,
  GetSuiTokenBalanceOptions,
  GetSuiNftBalanceOptions,
} from './types';

const log = logger(import.meta);

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
    } else if (
      options.balanceSourceType == BalanceSourceType.SPL ||
      options.balanceSourceType == BalanceSourceType.SOLNFT
    ) {
      balances = await getSolanaBalances(options, ttl);
    } else if (
      options.balanceSourceType === BalanceSourceType.SuiNative ||
      options.balanceSourceType === BalanceSourceType.SuiToken ||
      options.balanceSourceType === BalanceSourceType.SuiNFT
    ) {
      balances = await getSuiBalances(
        options as
          | GetSuiNativeBalanceOptions
          | GetSuiTokenBalanceOptions
          | GetSuiNftBalanceOptions,
        ttl,
      );
    } else {
      balances = await getEvmBalances(options as GetEvmBalancesOptions, ttl);
    }
  } catch (e) {
    const chainId =
      options.balanceSourceType === BalanceSourceType.SPL
        ? 'solana'
        : options.balanceSourceType === BalanceSourceType.SuiNative ||
            options.balanceSourceType === BalanceSourceType.SuiToken ||
            options.balanceSourceType === BalanceSourceType.SuiNFT
          ? (
              options as
                | GetSuiNativeBalanceOptions
                | GetSuiTokenBalanceOptions
                | GetSuiNftBalanceOptions
            ).sourceOptions.suiNetwork
              .sourceOptions.suiNetwork
          : (options as GetEvmBalancesOptions).sourceOptions.evmChainId ||
            (options as GetCosmosBalancesOptions).sourceOptions.cosmosChainId;

    const contractAddress =
      (options as GetSPLBalancesOptions).mintAddress ||
      (options as GetErcBalanceOptions).sourceOptions.contractAddress ||
      (options as GetSuiNativeBalanceOptions).sourceOptions.objectId ||
      (options.balanceSourceType === BalanceSourceType.SuiToken
        ? (options as GetSuiTokenBalanceOptions).sourceOptions.coinType
        : options.balanceSourceType === BalanceSourceType.SuiNFT
        ? (options as GetSuiNftBalanceOptions).sourceOptions.collectionId
        : undefined);

    const msg =
      `Failed to fetch balance(s) for ${options.addresses.length} address(es)` +
      `on chain ${chainId}${contractAddress ? ' for contract ' : ''}${
        contractAddress || ''
      }`;

    log.error(msg, e instanceof Error ? e : undefined, {
      fingerprint: `TBC: ${chainId} - ${contractAddress}`,
      addresses: options.addresses.slice(0, 5),
      contractAddress: (options as GetErcBalanceOptions).sourceOptions
        ?.contractAddress,
      evmChainId: (options as GetEvmBalancesOptions).sourceOptions?.evmChainId,
      cosmosChainId: (options as GetCosmosBalancesOptions).sourceOptions
        ?.cosmosChainId,
      suiNetwork: (
        options as
          | GetSuiNativeBalanceOptions
          | GetSuiTokenBalanceOptions
          | GetSuiNftBalanceOptions
      ).sourceOptions?.suiNetwork,
      objectId: (options as GetSuiNativeBalanceOptions).sourceOptions?.objectId,
      coinType:
        options.balanceSourceType === BalanceSourceType.SuiToken
          ? (options as GetSuiTokenBalanceOptions).sourceOptions.coinType
          : undefined,
      collectionId:
        options.balanceSourceType === BalanceSourceType.SuiNFT
          ? (options as GetSuiNftBalanceOptions).sourceOptions.collectionId
          : undefined,
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
