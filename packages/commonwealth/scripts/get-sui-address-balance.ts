import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { mustExist } from '@hicommonwealth/model/middleware';
import {
  getBalances,
  type GetBalancesOptions,
} from '@hicommonwealth/model/tbc';
import { BalanceSourceType } from '@hicommonwealth/shared';

/**
 * Standalone script to get SUI native balance for a given address using the token balance cache
 * Usage: npx tsx get-sui-address-balance.ts <sui-address>
 */

async function getSuiAddressBalance(
  address: string,
  forceRefresh: boolean = false,
): Promise<string> {
  try {
    // get sui chain node to determine the network
    const suiChainNode = await models.ChainNode.findOne({
      where: {
        name: 'Sui Testnet',
      },
    });
    mustExist('Sui Testnet chain node not found', suiChainNode);

    // Validate address format (Sui addresses are 0x followed by 64 hex characters)
    const suiAddressPattern = /^0x[a-fA-F0-9]{64}$/;
    if (!suiAddressPattern.test(address)) {
      throw new Error(
        `Invalid Sui address format: ${address}. Address should be 0x followed by 64 hex characters.`,
      );
    }

    // Use the token balance cache to get SUI native balance
    const balanceOptions: GetBalancesOptions = {
      balanceSourceType: BalanceSourceType.SuiNative,
      addresses: [address],
      sourceOptions: {
        suiNetwork: suiChainNode.name,
      },
      cacheRefresh: forceRefresh,
    };

    const balances = await getBalances(balanceOptions);

    // Return the balance for this address, defaulting to '0' if not found
    return balances[address] || '0';
  } catch (error) {
    throw new Error(
      `Failed to fetch SUI balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

function formatSuiBalance(balance: string): string {
  // SUI has 9 decimal places (1 SUI = 10^9 MIST)
  const balanceNumber = BigInt(balance);
  const sui = balanceNumber / BigInt(10 ** 9);
  const mist = balanceNumber % BigInt(10 ** 9);

  if (mist === BigInt(0)) {
    return `${sui} SUI`;
  } else {
    // Format with decimal places, removing trailing zeros
    const decimal = mist.toString().padStart(9, '0').replace(/0+$/, '');
    return `${sui}.${decimal} SUI`;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: pnpm get-sui-address-balance.ts <sui-address> [--force-refresh]

Arguments:
  sui-address      The Sui address to check balance for (0x followed by 64 hex characters)
  --force-refresh  Skip cache and force fetch fresh balance data

Examples:
  npx tsx get-sui-address-balance.ts 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
  npx tsx get-sui-address-balance.ts 0x1234... --force-refresh

Environment Variables:
  RAW_OUTPUT=true    Output only the raw balance in MIST (useful for programmatic use)
    `);
    return;
  }

  const forceRefresh = args.includes('--force-refresh');
  const address = args.find((arg) => !arg.startsWith('--')) || args[0];

  try {
    console.log(
      `Fetching SUI balance for address: ${address}${forceRefresh ? ' (force refresh)' : ' (using cache)'}`,
    );

    const balance = await getSuiAddressBalance(address, forceRefresh);

    if (process.env.RAW_OUTPUT === 'true') {
      // Output just the raw balance for programmatic use
      console.log(balance);
    } else {
      console.log(`\nRaw balance: ${balance} MIST`);
      console.log(`Formatted balance: ${formatSuiBalance(balance)}`);
    }
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw error;
  }
}

// Export the function for potential reuse
export { formatSuiBalance, getSuiAddressBalance };

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
