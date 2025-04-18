import { logger } from '@hicommonwealth/core';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { models } from '../../../database';
import { Balances, GetSPLBalancesOptions } from '../types';
import { cacheBalances, getCachedBalances } from './cacheBalances';
import { __get_solnft_balances } from './get_solnft_balances';
import { __get_spl_balances } from './get_spl_balances';

const log = logger(import.meta);

export async function getSolanaBalances(
  options: GetSPLBalancesOptions,
  ttl?: number,
) {
  const cachedBalances = await getCachedBalances(options, options.addresses);
  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      balance_type: 'solana',
      name: options.solanaNetwork ?? 'Solana Mainnet',
    },
  });
  if (!chainNode) {
    const msg = `ChainNode for Solana does not exist`;
    log.error(msg, undefined);
    return {};
  }
  const freshBalances: Balances =
    options.balanceSourceType === BalanceSourceType.SPL
      ? await __get_spl_balances(chainNode, options)
      : await __get_solnft_balances(chainNode, options);

  await cacheBalances(options, freshBalances, ttl);

  return { ...freshBalances, ...cachedBalances };
}
