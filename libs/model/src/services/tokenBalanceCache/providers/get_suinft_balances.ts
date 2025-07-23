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
          // Get all owned objects for the address without filtering by struct type
          // This allows us to implement custom collection detection logic
          const res = await client.getOwnedObjects({
            owner: address,
            cursor,
            options: {
              showType: true,
              showContent: true,
              showDisplay: true,
            },
          });

          // Custom filtering logic for NFT collections
          const validNFTs = res.data.filter((obj) => {
            if (!obj.data) return false;

            // Method 1: Check if the object type matches the collection ID exactly
            if (obj.data.type === options.sourceOptions.collectionId) {
              return true;
            }

            // Method 2: Check if the object type contains the collection ID as part of the struct
            if (obj.data.type?.includes(options.sourceOptions.collectionId)) {
              return true;
            }

            // Method 3: Check content for collection metadata
            if (obj.data.content && typeof obj.data.content === 'object') {
              const content = obj.data.content as any;

              // Look for collection field in the content
              if (
                content.fields?.collection ===
                options.sourceOptions.collectionId
              ) {
                return true;
              }

              // Look for collection_id field
              if (
                content.fields?.collection_id ===
                options.sourceOptions.collectionId
              ) {
                return true;
              }

              // Look for collection in dataType moveObject
              if (content.dataType === 'moveObject' && content.fields) {
                // Check various common collection field names
                const collectionFields = [
                  'collection',
                  'collection_id',
                  'collection_name',
                  'creator',
                ];
                for (const field of collectionFields) {
                  if (
                    content.fields[field] === options.sourceOptions.collectionId
                  ) {
                    return true;
                  }
                }
              }
            }

            // Method 4: Check display metadata
            if (obj.data.display?.data) {
              const displayData = obj.data.display.data;
              if (
                displayData.collection === options.sourceOptions.collectionId
              ) {
                return true;
              }
            }

            return false;
          });

          count += validNFTs.length;
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
