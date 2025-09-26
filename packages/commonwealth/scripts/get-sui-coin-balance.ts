import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { mustExist } from '@hicommonwealth/model/middleware';
import {
  getBalances,
  type GetBalancesOptions,
} from '@hicommonwealth/model/tbc';
import { BalanceSourceType } from '@hicommonwealth/shared';

/**
 * Standalone script to get SUI coin balance for a given address and token type using the token balance cache
 * Usage: pnpm get-sui-coin-balance <sui-address> <coin-type>
 */

async function getSuiCoinBalance(
  address: string,
  coinType: string,
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

    // Validate coin type format (should contain :: separators)
    if (!coinType.includes('::')) {
      throw new Error(
        `Invalid coin type format: ${coinType}. Coin type should be in format: 0x<package>::<module>::<type>`,
      );
    }

    // Use the token balance cache to get SUI coin balance
    const balanceOptions: GetBalancesOptions = {
      balanceSourceType: BalanceSourceType.SuiToken,
      addresses: [address],
      sourceOptions: {
        suiNetwork: suiChainNode.name,
        coinType: coinType,
      },
      cacheRefresh: forceRefresh,
    };

    const balances = await getBalances(balanceOptions);

    // Return the balance for this address, defaulting to '0' if not found
    return balances[address] || '0';
  } catch (error) {
    throw new Error(
      `Failed to fetch SUI coin balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

function formatCoinBalance(balance: string, symbol?: string): string {
  // Most SUI coins have 9 decimal places, but this can vary
  // For formatting purposes, we'll assume 9 decimals unless specified otherwise
  const decimals = 9;
  const balanceNumber = BigInt(balance);
  const wholePart = balanceNumber / BigInt(10 ** decimals);
  const remainder = balanceNumber % BigInt(10 ** decimals);

  const displaySymbol = symbol || 'TOKENS';

  if (remainder === BigInt(0)) {
    return `${wholePart} ${displaySymbol}`;
  } else {
    // Format with decimal places, removing trailing zeros
    const decimal = remainder
      .toString()
      .padStart(decimals, '0')
      .replace(/0+$/, '');
    return `${wholePart}.${decimal} ${displaySymbol}`;
  }
}

function extractSymbolFromCoinType(coinType: string): string {
  // Extract the last part after :: as the symbol
  // e.g., "0x4a5313fa76e8abad0f812467de9bd7188abefba666fe9e262a2ded0863d60ea8::mock_navx_token::MOCK_NAVX_TOKEN"
  // becomes "MOCK_NAVX_TOKEN"
  const parts = coinType.split('::');
  return parts[parts.length - 1] || 'TOKEN';
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: pnpm get-sui-coin-balance <sui-address> <coin-type> [--force-refresh]

Arguments:
  sui-address      The Sui address to check balance for (0x followed by 64 hex characters)
  coin-type        The coin type identifier
                   (e.g., 0x4a5313fa76e8abad0f812467de9bd7188abefba666fe9e262a2ded0863d60ea8::
                   mock_navx_token::MOCK_NAVX_TOKEN)
  --force-refresh  Skip cache and force fetch fresh balance data

Examples:
  pnpm get-sui-coin-balance 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \
    0x4a5313fa76e8abad0f812467de9bd7188abefba666fe9e262a2ded0863d60ea8::mock_navx_token::MOCK_NAVX_TOKEN
  pnpm get-sui-coin-balance 0x1234... 0x4a5313... --force-refresh

Environment Variables:
  RAW_OUTPUT=true    Output only the raw balance in smallest units (useful for programmatic use)
    `);
    return;
  }

  if (args.length < 2) {
    console.error('Error: Both sui-address and coin-type are required');
    console.log('Use --help for usage information');
    return;
  }

  const forceRefresh = args.includes('--force-refresh');
  const nonFlagArgs = args.filter((arg) => !arg.startsWith('--'));
  const address = nonFlagArgs[0];
  const coinType = nonFlagArgs[1];

  if (!address || !coinType) {
    console.error('Error: Both sui-address and coin-type are required');
    return;
  }

  try {
    console.log(
      `Fetching SUI coin balance for address: ${address}${forceRefresh ? ' (force refresh)' : ' (using cache)'}`,
    );
    console.log(`Coin type: ${coinType}`);

    const balance = await getSuiCoinBalance(address, coinType, forceRefresh);
    const symbol = extractSymbolFromCoinType(coinType);

    if (process.env.RAW_OUTPUT === 'true') {
      // Output just the raw balance for programmatic use
      console.log(balance);
    } else {
      console.log(`\nRaw balance: ${balance} (smallest units)`);
      console.log(`Formatted balance: ${formatCoinBalance(balance, symbol)}`);
    }
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw error;
  }
}

// Export the function for potential reuse
export { extractSymbolFromCoinType, formatCoinBalance, getSuiCoinBalance };

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
