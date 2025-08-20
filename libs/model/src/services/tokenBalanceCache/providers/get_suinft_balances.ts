import { logger } from '@hicommonwealth/core';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { Balances, GetSuiNftBalanceOptions } from '../types';

const log = logger(import.meta);

export async function __get_suinft_balances(
  rpcEndpoint: string,
  options: GetSuiNftBalanceOptions,
): Promise<Balances> {
  const collectionId = options.sourceOptions.collectionId.split('::')[0];

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
          console.log('RES', JSON.stringify(res, null, 2));

          // Call voting_power function for each valid NFT
          for (const obj of res.data) {
            if (obj.data?.type && obj.data.type.includes('VoteEscrowedToken')) {
              try {
                console.log(
                  `Attempting to get voting power for NFT type: ${obj.data.type}`,
                );
                console.log(`Collection ID: ${collectionId}`);

                // Create transaction block to call voting_power function
                const tx = new Transaction();

                // Get clock object (Sui system clock)
                const clockObjectId = '0x6'; // Standard Sui clock object ID

                // Extract package ID and module from the NFT type (more reliable than collection ID)
                const nftType = obj.data.type;
                const typeMatch = nftType.match(/^(0x[a-fA-F0-9]+)::([^:]+)::/);

                if (!typeMatch) {
                  console.warn(`Could not parse NFT type: ${nftType}`);
                  continue;
                }

                const [, packageId, moduleName] = typeMatch;
                console.log(
                  `Calling ${packageId}::${moduleName}::voting_power`,
                );

                // Extract the type parameter from the VoteEscrowedToken type
                const typeParamMatch = nftType.match(
                  /VoteEscrowedToken<(.+?)>/,
                );
                const typeArguments = typeParamMatch ? [typeParamMatch[1]] : [];

                tx.moveCall({
                  target: `${packageId}::${moduleName}::voting_power`,
                  arguments: [
                    tx.object(obj.data.objectId), // VoteEscrowedToken object
                    tx.object(clockObjectId), // Clock object
                  ],
                  typeArguments: typeArguments,
                });

                // Execute the transaction as a dev inspect to get the result without sending
                const result = await client.devInspectTransactionBlock({
                  transactionBlock: tx,
                  sender: address, // Use the current address as sender
                });

                if (result.results && result.results[0]?.returnValues) {
                  const votingPower = result.results[0].returnValues[0];
                  if (votingPower && votingPower[0]) {
                    // Parse the voting power (assuming it's returned as bytes representing u64)
                    const votingPowerValue = new DataView(
                      new Uint8Array(votingPower[0]).buffer,
                    ).getBigUint64(0, true);
                    console.log(
                      `Voting power for NFT ${obj.data.objectId}: ${votingPowerValue.toString()}`,
                    );
                  }
                }
              } catch (votingPowerError) {
                console.warn(
                  `Failed to get voting power for NFT ${obj.data?.objectId}:`,
                  votingPowerError,
                );
              }
            }
          }

          // Custom filtering logic for NFT collections
          const validNFTs = res.data.filter((obj) => {
            if (!obj.data) return false;

            // ignore fungible tokens
            if (obj.data.type?.startsWith('0x2::coin::Coin<')) {
              return false;
            }

            // Method 1: Check if the object type matches the collection ID exactly
            if (obj.data.type === collectionId) {
              return true;
            }

            // Method 2: Check if the object type contains the collection ID as part of the struct
            if (obj.data.type?.includes(collectionId)) {
              return true;
            }

            // Method 3: Check content for collection metadata
            if (obj.data.content && typeof obj.data.content === 'object') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const content = obj.data.content as any;

              // Look for collection field in the content
              if (content.fields?.collection === collectionId) {
                return true;
              }

              // Look for collection_id field
              if (content.fields?.collection_id === collectionId) {
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
                  if (content.fields[field] === collectionId) {
                    return true;
                  }
                }
              }
            }

            // Method 4: Check display metadata
            if (obj.data.display?.data) {
              const displayData = obj.data.display.data;
              if (displayData.collection === collectionId) {
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
