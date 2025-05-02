import { logger } from '@hicommonwealth/core';
import { SuiClient } from '@mysten/sui.js/client';
import { models } from '../../../database';
import {
  Balances,
  GetSuiNativeBalanceOptions,
  GetSuiTokenBalanceOptions,
} from '../types';
import { cacheBalances, getCachedBalances } from './cacheBalances';

const log = logger(import.meta);

export async function getSuiBalances(
  options: GetSuiNativeBalanceOptions | GetSuiTokenBalanceOptions,
  ttl?: number,
): Promise<Balances> {
  const cachedBalances = await getCachedBalances(options, options.addresses);
  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      balance_type: 'sui',
      name: options.sourceOptions.suiNetwork,
    },
  });

  if (!chainNode) {
    const msg = `ChainNode for Sui network ${options.sourceOptions.suiNetwork} does not exist`;
    log.error(msg, undefined);
    return {};
  }

  // Use cached balances only for addresses that were in the cache
  if (options.addresses.length === 0) {
    return cachedBalances;
  }

  const freshBalances: Balances = await __get_sui_balances(
    chainNode.private_url || chainNode.url,
    options,
  );

  await cacheBalances(options, freshBalances, ttl);

  return { ...freshBalances, ...cachedBalances };
}

async function __get_sui_balances(
  rpcEndpoint: string,
  options: GetSuiNativeBalanceOptions | GetSuiTokenBalanceOptions,
): Promise<Balances> {
  const balances: Balances = {};
  const batchSize = options.batchSize || 100;
  const client = new SuiClient({ url: rpcEndpoint });

  // Process addresses in batches
  for (let i = 0; i < options.addresses.length; i += batchSize) {
    const batchAddresses = options.addresses.slice(i, i + batchSize);

    // Process each address individually
    for (const address of batchAddresses) {
      try {
        // Check if we're dealing with a token balance option (has coinType)
        if (
          'coinType' in options.sourceOptions &&
          options.sourceOptions.coinType
        ) {
          // Get the balance for the specific coin type
          const coinBalance = await client.getBalance({
            owner: address,
            coinType: options.sourceOptions.coinType,
          });

          balances[address] = coinBalance.totalBalance;
        }
        // If objectId is provided, get the balance of the specific coin
        else if (
          'objectId' in options.sourceOptions &&
          options.sourceOptions.objectId
        ) {
          // Get the specific object balance - to be used for SUI tokens or custom tokens
          const objectInfo = await client.getObject({
            id: options.sourceOptions.objectId,
            options: {
              showContent: true,
            },
          });

          if (objectInfo.data?.content?.dataType === 'moveObject') {
            // This is a simplistic approach - in a real implementation
            // you'd need to check the object's type and handle different kinds of tokens
            balances[address] = '1';
          } else {
            balances[address] = '0';
          }
        } else {
          // Get the native SUI balance
          const suiBalance = await client.getBalance({
            owner: address,
            coinType: '0x2::sui::SUI', // Native SUI coin
          });

          balances[address] = suiBalance.totalBalance;
        }
      } catch (error) {
        log.error(
          `Failed to fetch Sui balance for address ${address}`,
          error as Error,
        );
        balances[address] = '0';
      }
    }
  }

  return balances;
}
