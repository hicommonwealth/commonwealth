import { logger } from '@hicommonwealth/core';
import { SuiClient } from '@mysten/sui/client';
import type { Balances, GetSuiNftBalanceOptions } from '../types';

const log = logger(import.meta);

export async function __get_suinft_balances(
  rpcEndpoint: string,
  options: GetSuiNftBalanceOptions,
): Promise<Balances> {
  const client = new SuiClient({ url: rpcEndpoint });
  const balances: Balances = {};
  const batchSize = options.batchSize || 100;

  for (let i = 0; i < options.addresses.length; i += batchSize) {
    const batchAddresses = options.addresses.slice(i, i + batchSize);
    for (const address of batchAddresses) {
      try {
        let cursor: string | null | undefined = null;
        let count = 0;
        do {
          const res = await client.getOwnedObjects({
            owner: address,
            cursor,
            filter: { StructType: options.sourceOptions.collectionId },
            options: { showType: true },
          });
          count += res.data.length;
          cursor = res.hasNextPage ? res.nextCursor : null;
        } while (cursor);
        balances[address] = count.toString();
      } catch (e) {
        log.error(`Failed to fetch Sui NFT balance for ${address}`, e as Error);
        balances[address] = '0';
      }
    }
  }

  return balances;
}
