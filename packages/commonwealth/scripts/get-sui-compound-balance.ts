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
import { getWeightedSuiNFTs } from '../../../libs/model/src/services/stakeHelper';

// Use ChainNodeAttributes type (plain data object, not Sequelize instance)
type ChainNodeAttributes = z.infer<typeof ChainNode>;

/**
 * Interactive CLI script to calculate compound balance for two SUI tokens with weighted voting
 * Usage: pnpm get-sui-compound-balance
 *
 * Or with arguments: pnpm get-sui-compound-balance <sui-address> <primary-coin-type> <secondary-coin-type> [multiplier]
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
    balanceSourceType: BalanceSourceType.SuiNFT,
    addresses: [address],
    sourceOptions: {
      suiNetwork: chainNode.name,
      fullObjectType: coinType,
    },
    cacheRefresh: true,
  };

  const balances = await getBalances(balanceOptions);
  const tokenBalance = balances[address];
  return BigInt(tokenBalance || 0);
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
  multiplier: number = 1,
): Promise<{
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

  console.log(`\nFetching balances for address: ${address}`);
  console.log(`Using multiplier: ${multiplier}\n`);

  // Fetch individual balances for display
  const primarySymbol = extractSymbolFromCoinType(primaryCoinType);
  const secondarySymbol = extractSymbolFromCoinType(secondaryCoinType);

  // Calculate weighted compound balance using getWeightedSuiNFTs from stakeHelper
  // This applies the multiplier to calculate vote weight
  const compoundBalanceBigInt = await getWeightedSuiNFTs(
    address,
    primaryCoinType,
    suiChainNode.id!,
    multiplier,
    [
      {
        token_address: secondaryCoinType,
        token_decimals: 0, // NFTs typically have 0 decimals
        vote_weight_multiplier: multiplier,
      },
    ],
  );
  const compoundBalance = compoundBalanceBigInt.toString();

  return {
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

    const multiplierStr = await question(
      rl,
      'Enter vote weight multiplier (default 1): ',
    );
    const multiplier = multiplierStr.trim()
      ? parseFloat(multiplierStr.trim())
      : 1;

    if (isNaN(multiplier) || multiplier < 0) {
      throw new Error('Multiplier must be a positive number');
    }

    console.log('\n--- Fetching balances... ---');

    const result = await getCompoundBalance(
      address.trim(),
      primaryCoinType.trim(),
      secondaryCoinType.trim(),
      multiplier,
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
Usage: pnpm get-sui-compound-balance [<sui-address> <primary-coin-type> <secondary-coin-type> [multiplier]]

Interactive Mode (no arguments):
  The script will prompt you for the required information.

Command Line Mode (with arguments):
  sui-address          The Sui address to check balance for (0x followed by 64 hex characters)
  primary-coin-type    The primary coin type identifier (e.g., 0x<package>::<module>::<type>)
  secondary-coin-type  The secondary coin type identifier (e.g., 0x<package>::<module>::<type>)
  multiplier           Vote weight multiplier (optional, default: 1)

Examples:
  # Interactive mode
  pnpm get-sui-compound-balance

  # Command line mode with default multiplier (1)
  pnpm get-sui-compound-balance \\
    0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \\
    0x4a5313fa76e8abad0f812467de9bd7188abefba666fe9e262a2ded0863d60ea8::mock_navx_token::MOCK_NAVX_TOKEN \\
    0x5e8e6924d9b6d8c1234567890abcdef1234567890abcdef1234567890abcdef::sui_coin::SUI_COIN

  # Command line mode with custom multiplier
  pnpm get-sui-compound-balance \\
    0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \\
    0x4a5313fa76e8abad0f812467de9bd7188abefba666fe9e262a2ded0863d60ea8::mock_navx_token::MOCK_NAVX_TOKEN \\
    0x5e8e6924d9b6d8c1234567890abcdef1234567890abcdef1234567890abcdef::sui_coin::SUI_COIN \\
    2.5

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
  const multiplier = args[3] ? parseFloat(args[3]) : 1;

  if (isNaN(multiplier) || multiplier < 0) {
    console.error('Error: Multiplier must be a positive number');
    throw new Error('Invalid multiplier');
  }

  try {
    const result = await getCompoundBalance(
      address,
      primaryCoinType,
      secondaryCoinType,
      multiplier,
    );

    if (process.env.RAW_OUTPUT === 'true') {
      // Output just the raw compound balance for programmatic use
      console.log(result.compound.balance);
    } else {
      console.log('\n=== Compound Balance Result ===\n');
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
