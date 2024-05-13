import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import { fileURLToPath } from 'url';
import { Balances, GetSPLBalancesOptions } from '../types';
import { cacheBalances, getCachedBalances } from './cacheBalances';
import { __get_spl_balances } from './get_spl_balances';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export async function getSolanaBalances(
  options: GetSPLBalancesOptions,
  ttl?: number,
) {
  const cachedBalances = await getCachedBalances(options, options.addresses);

  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      balance_type: 'solana',
      name: 'Solana (Mainnet Beta)',
    },
  });
  if (!chainNode) {
    const msg = `ChainNode with for Solana does not exist`;
    log.error(msg, undefined);
    return {};
  }
  const freshBalances: Balances = await __get_spl_balances(chainNode, options);

  await cacheBalances(options, freshBalances, ttl);

  return { ...freshBalances, ...cachedBalances };
}
