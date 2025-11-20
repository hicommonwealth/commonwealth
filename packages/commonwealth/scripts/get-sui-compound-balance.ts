import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { mustExist } from '@hicommonwealth/model/middleware';
import {
  getBalances,
  type GetBalancesOptions,
} from '@hicommonwealth/model/tbc';
import { ChainNode } from '@hicommonwealth/schemas';
import { BalanceSourceType } from '@hicommonwealth/shared';
import * as readline from 'readline';
import { z } from 'zod';

// Use ChainNodeAttributes type (plain data object, not Sequelize instance)
type ChainNodeAttributes = z.infer<typeof ChainNode>;

/**
 * Interactive CLI script to calculate compound balance for two SUI tokens
 * Usage: pnpm get-sui-compound-balance
 *
 * Or with arguments: pnpm get-sui-compound-balance <sui-address> <primary-coin-type> <secondary-coin-type>
 */

interface TokenBalance {
  coinType: string;
  balance: string;
  symbol: string;
}

/**
 * Helper function to get SUI token balance for a single coin type
 * Follows the pattern from getSuiNFTBalance in stakeHelper.ts
 */
async function getSuiTokenBalance(
  chainNode: ChainNodeAttributes,
  address: string,
  coinType: string,
): Promise<bigint> {
  const balanceOptions: GetBalancesOptions = {
    balanceSourceType: BalanceSourceType.SuiToken,
    addresses: [address],
    sourceOptions: {
      suiNetwork: chainNode.name,
      coinType,
    },
    cacheRefresh: true,
  };

  const balances = await getBalances(balanceOptions);
  const tokenBalance = balances[address];
  return BigInt(tokenBalance || 0);
}

/**
 * Helper function to calculate compound balance for multiple SUI tokens
 * Follows the pattern from getWeightedSuiNFTs in stakeHelper.ts
 */
async function getCompoundSuiTokenBalance(
  chainNode: ChainNodeAttributes,
  address: string,
  primaryCoinType: string,
  secondaryCoinTypes: string[],
): Promise<bigint> {
  // Get primary token balance
  let compoundBalance = await getSuiTokenBalance(
    chainNode,
    address,
    primaryCoinType,
  );

  // Add secondary token balances
  if (secondaryCoinTypes && secondaryCoinTypes.length > 0) {
    for (const secondaryCoinType of secondaryCoinTypes) {
      const secondaryBalance = await getSuiTokenBalance(
        chainNode,
        address,
        secondaryCoinType,
      );
      compoundBalance += secondaryBalance;
    }
  }

  return compoundBalance;
}

function extractSymbolFromCoinType(coinType: string): string {
  // Extract the last part after :: as the symbol
  const parts = coinType.split('::');
  return parts[parts.length - 1] || 'TOKEN';
}

function formatCoinBalance(
  balance: string,
  symbol?: string,
  decimals: number = 9,
): string {
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

async function getCompoundBalance(
  address: string,
  primaryCoinType: string,
  secondaryCoinType: string,
): Promise<{
  primary: TokenBalance;
  secondary: TokenBalance;
  compound: {
    balance: string;
    formatted: string;
  };
}> {
  // Validate address format
  const suiAddressPattern = /^0x[a-fA-F0-9]{64}$/;
  if (!suiAddressPattern.test(address)) {
    throw new Error(
      `Invalid Sui address format: ${address}. Address should be 0x followed by 64 hex characters.`,
    );
  }

  // Validate coin type formats
  if (!primaryCoinType.includes('::')) {
    throw new Error(
      `Invalid primary coin type format: ${primaryCoinType}. ` +
        `Coin type should be in format: 0x<package>::<module>::<type>`,
    );
  }

  if (!secondaryCoinType.includes('::')) {
    throw new Error(
      `Invalid secondary coin type format: ${secondaryCoinType}. ` +
        `Coin type should be in format: 0x<package>::<module>::<type>`,
    );
  }

  // Get the Sui chain node
  const suiChainNode = await models.ChainNode.findOne({
    where: {
      name: 'Sui Mainnet',
    },
  });
  mustExist('Sui Mainnet chain node not found', suiChainNode);

  console.log(`\nFetching balances for address: ${address}\n`);

  // Fetch individual balances for display
  const primaryBalance = await getSuiTokenBalance(
    suiChainNode,
    address,
    primaryCoinType,
  );
  const primarySymbol = extractSymbolFromCoinType(primaryCoinType);
  console.log(
    `✓ Primary token (${primarySymbol}): ${formatCoinBalance(primaryBalance.toString(), primarySymbol)}`,
  );

  const secondaryBalance = await getSuiTokenBalance(
    suiChainNode,
    address,
    secondaryCoinType,
  );
  const secondarySymbol = extractSymbolFromCoinType(secondaryCoinType);
  console.log(
    `✓ Secondary token (${secondarySymbol}): ${formatCoinBalance(secondaryBalance.toString(), secondarySymbol)}`,
  );

  // Calculate compound balance using helper function (follows pattern from getWeightedSuiNFTs)
  const compoundBalanceBigInt = await getCompoundSuiTokenBalance(
    suiChainNode,
    address,
    primaryCoinType,
    [secondaryCoinType],
  );
  const compoundBalance = compoundBalanceBigInt.toString();

  return {
    primary: {
      coinType: primaryCoinType,
      balance: primaryBalance.toString(),
      symbol: primarySymbol,
    },
    secondary: {
      coinType: secondaryCoinType,
      balance: secondaryBalance.toString(),
      symbol: secondarySymbol,
    },
    compound: {
      balance: compoundBalance,
      formatted: formatCoinBalance(compoundBalance, 'TOTAL'),
    },
  };
}

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function interactiveMode() {
  const rl = createReadlineInterface();

  try {
    console.log('\n=== SUI Compound Balance Calculator ===\n');

    const address = await question(
      rl,
      'Enter Sui address (0x followed by 64 hex characters): ',
    );

    const primaryCoinType = await question(
      rl,
      'Enter primary coin type (e.g., 0xPACKAGE::module::TYPE): ',
    );

    const secondaryCoinType = await question(
      rl,
      'Enter secondary coin type (e.g., 0xPACKAGE::module::TYPE): ',
    );

    console.log('\n--- Fetching balances... ---');

    const result = await getCompoundBalance(
      address.trim(),
      primaryCoinType.trim(),
      secondaryCoinType.trim(),
    );

    console.log('\n=== Compound Balance Result ===\n');
    console.log(`Primary (${result.primary.symbol}):`);
    console.log(`  Raw: ${result.primary.balance}`);
    console.log(
      `  Formatted: ${formatCoinBalance(result.primary.balance, result.primary.symbol)}`,
    );
    console.log();
    console.log(`Secondary (${result.secondary.symbol}):`);
    console.log(`  Raw: ${result.secondary.balance}`);
    console.log(
      `  Formatted: ${formatCoinBalance(result.secondary.balance, result.secondary.symbol)}`,
    );
    console.log();
    console.log('🎯 Compound Balance:');
    console.log(`  Raw: ${result.compound.balance}`);
    console.log(`  Formatted: ${result.compound.formatted}`);
    console.log();
  } finally {
    rl.close();
  }
}

async function commandLineMode() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: pnpm get-sui-compound-balance [<sui-address> <primary-coin-type> <secondary-coin-type>]

Interactive Mode (no arguments):
  The script will prompt you for the required information.

Command Line Mode (with arguments):
  sui-address          The Sui address to check balance for (0x followed by 64 hex characters)
  primary-coin-type    The primary coin type identifier (e.g., 0x<package>::<module>::<type>)
  secondary-coin-type  The secondary coin type identifier (e.g., 0x<package>::<module>::<type>)

Examples:
  # Interactive mode
  pnpm get-sui-compound-balance

  # Command line mode
  pnpm get-sui-compound-balance \\
    0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \\
    0x4a5313fa76e8abad0f812467de9bd7188abefba666fe9e262a2ded0863d60ea8::mock_navx_token::MOCK_NAVX_TOKEN \\
    0x5e8e6924d9b6d8c1234567890abcdef1234567890abcdef1234567890abcdef::sui_coin::SUI_COIN

Environment Variables:
  RAW_OUTPUT=true    Output only the raw compound balance in smallest units (useful for programmatic use)
    `);
    return;
  }

  if (args.length < 3) {
    // Run in interactive mode if insufficient arguments
    return interactiveMode();
  }

  const address = args[0];
  const primaryCoinType = args[1];
  const secondaryCoinType = args[2];

  try {
    const result = await getCompoundBalance(
      address,
      primaryCoinType,
      secondaryCoinType,
    );

    if (process.env.RAW_OUTPUT === 'true') {
      // Output just the raw compound balance for programmatic use
      console.log(result.compound.balance);
    } else {
      console.log('\n=== Compound Balance Result ===\n');
      console.log(`Primary (${result.primary.symbol}):`);
      console.log(`  Raw: ${result.primary.balance}`);
      console.log(
        `  Formatted: ${formatCoinBalance(result.primary.balance, result.primary.symbol)}`,
      );
      console.log();
      console.log(`Secondary (${result.secondary.symbol}):`);
      console.log(`  Raw: ${result.secondary.balance}`);
      console.log(
        `  Formatted: ${formatCoinBalance(result.secondary.balance, result.secondary.symbol)}`,
      );
      console.log();
      console.log('🎯 Compound Balance:');
      console.log(`  Raw: ${result.compound.balance}`);
      console.log(`  Formatted: ${result.compound.formatted}`);
      console.log();
    }
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No arguments - run interactive mode
    await interactiveMode();
  } else {
    // Has arguments - run command line mode (which will also handle --help)
    await commandLineMode();
  }
}

main()
  .then(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('EXIT', true);
  })
  .catch((error) => {
    console.error('Error in main execution:', error);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
