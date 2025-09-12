import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { mustExist } from '@hicommonwealth/model/middleware';
import {
  getBalances,
  type GetBalancesOptions,
} from '@hicommonwealth/model/tbc';
import { BalanceSourceType } from '@hicommonwealth/shared';

/**
 * Standalone script to get SUI NFT balance for a given address and full object type using the token balance cache
 * Usage: pnpm get-sui-address-nft-balance <sui-address> <full-object-type>
 */

async function getSuiAddressNftBalance(
  address: string,
  fullObjectType: string,
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

    // Validate fullObjectType format (should be a valid Move type like 0xpackage::module::struct)
    const moveTypePattern =
      /^0x[a-fA-F0-9]+::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_<>,:\s]*$/;
    if (!moveTypePattern.test(fullObjectType)) {
      throw new Error(
        `Invalid full object type format: ${fullObjectType}. ` +
          `Should be in format 0xpackage::module::struct (e.g., 0x123::collection::NFT)`,
      );
    }

    // Use the token balance cache to get SUI NFT balance
    const balanceOptions: GetBalancesOptions = {
      balanceSourceType: BalanceSourceType.SuiNFT,
      addresses: [address],
      sourceOptions: {
        suiNetwork: suiChainNode.name,
        fullObjectType: fullObjectType,
      },
      cacheRefresh: forceRefresh,
    };

    const balances = await getBalances(balanceOptions);

    // Return the balance for this address (could be voting power or NFT count), defaulting to '0' if not found
    return balances[address] || '0';
  } catch (error) {
    throw new Error(
      `Failed to fetch SUI NFT balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

function formatNftBalance(balance: string, fullObjectType: string): string {
  const count = BigInt(balance);
  const typeName = fullObjectType.split('::').pop() || 'Unknown';
  const packageAddress = fullObjectType.split('::')[0];
  const displayName = `${packageAddress.slice(0, 10)}...::${typeName}`;

  // Check if this is a VoteEscrowedToken type
  const isVoteEscrowedToken = fullObjectType.includes('VoteEscrowedToken');
  if (isVoteEscrowedToken) {
    // For VoteEscrowedTokens, the balance represents voting power
    if (count === 0n) {
      return `0 voting power from ${displayName}`;
    } else {
      return `${count.toString()} voting power from ${displayName}`;
    }
  } else {
    // For regular NFTs, the balance represents count
    if (count === 0n) {
      return `0 NFTs from ${displayName}`;
    } else if (count === 1n) {
      return `1 NFT from ${displayName}`;
    } else {
      return `${count.toString()} NFTs from ${displayName}`;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: pnpm get-sui-address-nft-balance.ts <sui-address> <full-object-type> [--force-refresh]

Arguments:
  sui-address      The Sui address to check NFT balance for (0x followed by 64 hex characters)
  full-object-type The full Move object type to check balance for (e.g., 0xpackage::module::struct)
  --force-refresh  Skip cache and force fetch fresh balance data

Examples:
  # Regular NFT collection
  pnpm get-sui-nft-balance 0x1234... 0xabcdef123456::collection::MyNFT

  # VoteEscrowedToken (returns voting power instead of count)
  pnpm get-sui-nft-balance 0x1234... 0xf21c5d05c...::vault::VoteEscrowedToken<...>

  # Force refresh cache
  pnpm get-sui-nft-balance 0x1234... 0xabcdef::module::NFT --force-refresh

Environment Variables:
  RAW_OUTPUT=true    Output only the raw balance value (useful for programmatic use)

Note:
  - The full-object-type must be a complete Move type specification (0xpackage::module::struct)
  - For VoteEscrowedToken types, the balance represents voting power rather than NFT count
  - For regular NFT types, the balance represents the number of NFTs owned
  - The script automatically detects the type and formats output accordingly
    `);
    return;
  }

  const forceRefresh = args.includes('--force-refresh');
  const nonFlagArgs = args.filter((arg) => !arg.startsWith('--'));

  if (nonFlagArgs.length < 2) {
    console.error('Error: Both sui-address and full-object-type are required.');
    console.error('Use --help for usage information.');
    return dispose();
  }

  const [address, fullObjectType] = nonFlagArgs;

  try {
    console.log(
      `Fetching SUI NFT balance for address: ${address}${forceRefresh ? ' (force refresh)' : ' (using cache)'}`,
    );
    console.log(`Full Object Type: ${fullObjectType}`);

    const balance = await getSuiAddressNftBalance(
      address,
      fullObjectType,
      forceRefresh,
    );

    if (process.env.RAW_OUTPUT === 'true') {
      // Output just the raw balance value for programmatic use
      console.log(balance);
    } else {
      const isVoteEscrowedToken = fullObjectType.includes('VoteEscrowedToken');
      console.log(
        `\nRaw balance: ${balance}${isVoteEscrowedToken ? ' (voting power)' : ' (NFT count)'}`,
      );
      console.log(
        `Formatted balance: ${formatNftBalance(balance, fullObjectType)}`,
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
