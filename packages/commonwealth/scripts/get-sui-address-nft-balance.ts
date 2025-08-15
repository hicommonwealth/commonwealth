import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { mustExist } from '@hicommonwealth/model/middleware';
import {
  getBalances,
  type GetBalancesOptions,
} from '@hicommonwealth/model/tbc';
import { BalanceSourceType } from '@hicommonwealth/shared';

/**
 * Standalone script to get SUI NFT balance for a given address and collection using the token balance cache
 * Usage: pnpm get-sui-address-nft-balance <sui-address> <collection-id>
 */

async function getSuiAddressNftBalance(
  address: string,
  collectionId: string,
  forceRefresh: boolean = false,
): Promise<string> {
  try {
    // get sui chain node to determine the network
    const suiChainNode = await models.ChainNode.findOne({
      where: {
        name: 'Sui Mainnet',
      },
    });
    mustExist('Sui Mainnet chain node not found', suiChainNode);

    // Validate address format (Sui addresses are 0x followed by 64 hex characters)
    const suiAddressPattern = /^0x[a-fA-F0-9]{64}$/;
    if (!suiAddressPattern.test(address)) {
      throw new Error(
        `Invalid Sui address format: ${address}. Address should be 0x followed by 64 hex characters.`,
      );
    }

    // Validate collection ID format (should start with 0x and be a valid hex string)
    if (
      !collectionId.startsWith('0x') ||
      !/^0x[a-fA-F0-9]+$/.test(collectionId)
    ) {
      throw new Error(
        `Invalid collection ID format: ${collectionId}. Collection ID should start with 0x followed by hex characters.`,
      );
    }

    // Use the token balance cache to get SUI NFT balance
    const balanceOptions: GetBalancesOptions = {
      balanceSourceType: BalanceSourceType.SuiNFT,
      addresses: [address],
      sourceOptions: {
        suiNetwork: suiChainNode.name,
        collectionId: collectionId,
      },
      cacheRefresh: forceRefresh,
    };

    const balances = await getBalances(balanceOptions);

    // Return the NFT count for this address, defaulting to '0' if not found
    return balances[address] || '0';
  } catch (error) {
    throw new Error(
      `Failed to fetch SUI NFT balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

function formatNftBalance(balance: string, collectionId: string): string {
  const count = parseInt(balance, 10);
  const collectionName =
    collectionId.slice(0, 20) + (collectionId.length > 20 ? '...' : '');

  if (count === 0) {
    return `0 NFTs from collection ${collectionName}`;
  } else if (count === 1) {
    return `1 NFT from collection ${collectionName}`;
  } else {
    return `${count} NFTs from collection ${collectionName}`;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: pnpm get-sui-address-nft-balance.ts <sui-address> <collection-id> [--force-refresh]

Arguments:
  sui-address      The Sui address to check NFT balance for (0x followed by 64 hex characters)
  collection-id    The collection ID to check balance for (0x followed by hex characters)
  --force-refresh  Skip cache and force fetch fresh balance data

Examples:
  pnpm get-sui-nft-balance 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef 0xabcdef123456
  pnpm get-sui-nft-balance 0x1234... 0xabcdef... --force-refresh

Environment Variables:
  RAW_OUTPUT=true    Output only the raw NFT count (useful for programmatic use)

Note:
  - The collection ID can be a full Move struct type (e.g., 0x123::collection::NFT) or just the package ID
  - The script will attempt multiple matching strategies to find NFTs in the specified collection
    `);
    return;
  }

  const forceRefresh = args.includes('--force-refresh');
  const nonFlagArgs = args.filter((arg) => !arg.startsWith('--'));

  if (nonFlagArgs.length < 2) {
    console.error('Error: Both sui-address and collection-id are required.');
    console.error('Use --help for usage information.');
    return dispose();
  }

  const [address, collectionId] = nonFlagArgs;

  try {
    console.log(
      `Fetching SUI NFT balance for address: ${address}${forceRefresh ? ' (force refresh)' : ' (using cache)'}`,
    );
    console.log(`Collection ID: ${collectionId}`);

    const balance = await getSuiAddressNftBalance(
      address,
      collectionId,
      forceRefresh,
    );

    if (process.env.RAW_OUTPUT === 'true') {
      // Output just the raw NFT count for programmatic use
      console.log(balance);
    } else {
      console.log(`\nRaw balance: ${balance} NFTs`);
      console.log(
        `Formatted balance: ${formatNftBalance(balance, collectionId)}`,
      );
    }
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw error;
  }
}

// Export the function for potential reuse
export { formatNftBalance, getSuiAddressNftBalance };

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .catch((error) => {
      console.error('Script failed:', error);
      throw error;
    })
    .finally(() => {
      return dispose();
    });
}
