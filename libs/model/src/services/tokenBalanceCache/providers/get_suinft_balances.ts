import { logger } from '@hicommonwealth/core';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { Balances, GetSuiNftBalanceOptions } from '../types';

const log = logger(import.meta);

function isMatchingNFT(
  obj: { data?: { type?: string | null } | null },
  fullObjectType: string,
): boolean {
  return obj.data?.type === fullObjectType;
}

export async function __get_suinft_balances(
  rpcEndpoint: string,
  options: GetSuiNftBalanceOptions,
): Promise<Balances> {
  // example: 0xf21c5d05c7886648e7a6e2519b7df1df21c9004568f895583c8ba1de1b402f54::vault::
  // VoteEscrowedToken<0x4a5313fa76e8abad0f812467de9bd7188abefba666fe9e262a2ded0863d60ea8::mock_navx_token::MOCK_NAVX_TOKEN>

  console.log(JSON.stringify(options, null, 2));

  const client = new SuiClient({ url: rpcEndpoint });
  const balances: Balances = {};
  const batchSize = options.batchSize || 100;

  for (let i = 0; i < options.addresses.length; i += batchSize) {
    const batchAddresses = options.addresses.slice(i, i + batchSize);
    for (const address of batchAddresses) {
      try {
        let cursor: string | null | undefined = null;
        let totalVotingPower = 0n; // Use BigInt to handle large voting power values
        let nftCount = 0; // Keep track of NFT count for fallback

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

          // Process each object to calculate voting power or count NFTs
          for (const obj of res.data) {
            if (!obj.data) continue;

            // Check if this is a VoteEscrowedToken (has voting power)
            if (obj.data.type && obj.data.type.includes('VoteEscrowedToken')) {
              console.log(
                `\nFound VoteEscrowedToken: ${JSON.stringify(obj, null, 2)}\n`,
              );
              // Check if it matches the specified package address and struct name
              if (isMatchingNFT(obj, options.sourceOptions.fullObjectType)) {
                try {
                  console.log(
                    `Getting voting power for NFT type: ${obj.data.type}`,
                  );

                  // Create transaction block to call voting_power function
                  const tx = new Transaction();

                  // Get clock object (Sui system clock)
                  const clockObjectId = '0x6'; // Standard Sui clock object ID

                  // Extract package ID and module from the NFT type
                  const nftType = obj.data.type;
                  const typeMatch = nftType.match(
                    /^(0x[a-fA-F0-9]+)::([^:]+)::/,
                  );

                  if (!typeMatch) {
                    console.warn(`Could not parse NFT type: ${nftType}`);
                    // Fallback to counting this NFT
                    nftCount++;
                    continue;
                  }

                  const [, packageId, moduleName] = typeMatch;

                  // Extract the type parameter from the VoteEscrowedToken type
                  const typeParamMatch = nftType.match(
                    /VoteEscrowedToken<(.+?)>/,
                  );
                  const typeArguments = typeParamMatch
                    ? [typeParamMatch[1]]
                    : [];

                  const target = `${packageId}::${moduleName}::voting_power`;
                  console.log(`Calling ${target}`);

                  tx.moveCall({
                    target,
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

                      totalVotingPower += votingPowerValue;
                      console.log(
                        `Voting power for NFT ${obj.data.objectId}: ${votingPowerValue.toString()}`,
                      );
                    } else {
                      // No voting power returned, count as 1 NFT
                      nftCount++;
                    }
                  } else {
                    // No results, count as 1 NFT
                    nftCount++;
                  }
                } catch (votingPowerError) {
                  console.warn(
                    `Failed to get voting power for NFT ${obj.data?.objectId}:`,
                    votingPowerError,
                  );
                  // Fallback to counting this NFT
                  nftCount++;
                }
              }
            } else {
              // Not a veNFT, but still matches
              if (isMatchingNFT(obj, options.sourceOptions.fullObjectType)) {
                nftCount++;
              }
            }
          }

          cursor = res.hasNextPage ? res.nextCursor : null;
        } while (cursor);

        // Use voting power if available, otherwise fallback to NFT count
        const finalBalance =
          totalVotingPower > 0n
            ? totalVotingPower.toString()
            : nftCount.toString();
        balances[address] = finalBalance;

        console.log(
          `Address ${address}: Total voting power: ${totalVotingPower}, ` +
            `NFT count: ${nftCount}, Final balance: ${finalBalance}`,
        );
      } catch (e) {
        log.error(`Failed to fetch Sui NFT balance for ${address}`, e as Error);
        balances[address] = '0';
      }
    }
  }

  return balances;
}
