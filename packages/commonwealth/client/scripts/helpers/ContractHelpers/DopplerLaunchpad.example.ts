import DopplerLaunchpad, {
  type DopplerLaunchpadConfig,
} from './DopplerLaunchpad';

/**
 * Example usage of DopplerLaunchpad for launching a token with 1% fees
 * distributed to Creator, LP (POL), and Protocol addresses.
 *
 * This file shows both wallet-based (client-side) and private key (server-side) usage.
 */

// Example dummy addresses for demonstration
const CREATOR_ADDRESS = '0x1234567890123456789012345678901234567890' as const;
const LP_POL_ADDRESS = '0x2345678901234567890123456789012345678901' as const;
const PROTOCOL_ADDRESS = '0x3456789012345678901234567890123456789012' as const;
const INTEGRATOR_ADDRESS =
  '0x4567890123456789012345678901234567890123' as const;

// Example private key (use your own in production)
const PRIVATE_KEY =
  '0x0123456789012345678901234567890123456789012345678901234567890123' as const;

// CLIENT-SIDE EXAMPLES (using wallet)
async function exampleWalletBasedLaunch() {
  const config: DopplerLaunchpadConfig = {
    // Token Configuration
    name: 'Wallet-Based Community Token',
    symbol: 'WCT',
    totalSupply: '1000000000', // 1B tokens
    numTokensToSell: '600000000', // 600M tokens for sale (60%)
    tokenURI: 'https://api.example.com/token/metadata.json',

    // Sale Timing
    duration: 30, // 30 day sale
    epochLength: 3600, // 1 hour epochs (3600 seconds)

    // Price Discovery (in ETH)
    startPrice: 0.0001, // Starting at 0.0001 ETH
    endPrice: 0.01, // Maximum price 0.01 ETH
    minProceeds: '10', // Minimum 10 ETH raised
    maxProceeds: '1000', // Maximum 1000 ETH raised

    // Fee Structure (1% each of transaction volume via 3% pool fee)
    creatorAddress: CREATOR_ADDRESS,
    lpAddress: LP_POL_ADDRESS, // Protocol Owned Liquidity
    protocolAddress: PROTOCOL_ADDRESS,
    integrator: INTEGRATOR_ADDRESS, // Required by Doppler SDK

    // Network (Base Sepolia for testing)
    chainId: 84532, // Base Sepolia testnet
    // rpcUrl: not needed for wallet mode - uses wallet's provider
    // No private key - will use wallet

    // No-op governance (permanent liquidity lock)
    useGovernance: false,
  };

  try {
    console.log('🚀 Launching token with user wallet...');

    const launchpad = new DopplerLaunchpad(config);

    // Check if wallet is ready
    if (!launchpad.isWalletReady()) {
      console.log('👛 Wallet not connected. This will prompt user to connect.');
    }

    // Launch with wallet (will prompt user for connection/approval)
    const result = await launchpad.launchTokenWithWallet();

    console.log('✅ Token successfully launched with wallet!');
    console.log(`📍 Token Address: ${result.token}`);
    console.log(`🎯 Hook Address: ${result.hook}`);
    console.log(`🔗 Transaction: ${result.txHash}`);
    console.log(`👛 Wallet Address: ${launchpad.getWalletAddress()}`);

    return result;
  } catch (error) {
    console.error('❌ Wallet-based launch failed:', error);
    throw error;
  }
}

// SERVER-SIDE EXAMPLES (using private key)
async function examplePrivateKeyBasedLaunch() {
  const config: DopplerLaunchpadConfig = {
    // Token Configuration
    name: 'Server-Side Community Token',
    symbol: 'SCT',
    totalSupply: '1000000000', // 1B tokens
    numTokensToSell: '600000000', // 600M tokens for sale (60%)
    tokenURI: 'https://api.example.com/token/metadata.json',

    // Sale Timing
    duration: 30, // 30 day sale
    epochLength: 3600, // 1 hour epochs

    // Price Discovery (in ETH)
    startPrice: 0.0001,
    endPrice: 0.01,
    minProceeds: '10',
    maxProceeds: '1000',

    // Fee Structure (1% each of transaction volume via 3% pool fee)
    creatorAddress: CREATOR_ADDRESS,
    lpAddress: LP_POL_ADDRESS,
    protocolAddress: PROTOCOL_ADDRESS,
    integrator: INTEGRATOR_ADDRESS,

    // Network
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    privateKey: PRIVATE_KEY, // Server-side private key

    // No-op governance
    useGovernance: false,
  };

  try {
    console.log('� Launching token with private key...');

    const launchpad = new DopplerLaunchpad(config);

    // Launch with private key (no user interaction needed)
    const result = await launchpad.launchTokenWithPrivateKey();

    console.log('✅ Token successfully launched with private key!');
    console.log(`📍 Token Address: ${result.token}`);
    console.log(`🎯 Hook Address: ${result.hook}`);
    console.log(`🔗 Transaction: ${result.txHash}`);
    console.log(`🔑 Deployer Address: ${launchpad.getWalletAddress()}`);

    return result;
  } catch (error) {
    console.error('❌ Private key launch failed:', error);
    throw error;
  }
}

async function exampleAdvancedLaunchWithVesting() {
  const config: DopplerLaunchpadConfig = {
    // Basic config
    name: 'Advanced Community Token',
    symbol: 'ACT',
    totalSupply: '10000000000', // 10B tokens
    numTokensToSell: '5000000000', // 5B tokens for sale (50%)

    // Sale parameters
    duration: 14, // 14 day sale
    epochLength: 1800, // 30 minute epochs
    startPrice: 0.00001,
    endPrice: 0.001,
    minProceeds: '50',
    maxProceeds: '500',

    // Fee addresses (each gets 1% of transaction volume via 3% pool fee)
    creatorAddress: CREATOR_ADDRESS,
    lpAddress: LP_POL_ADDRESS,
    protocolAddress: PROTOCOL_ADDRESS,
    integrator: INTEGRATOR_ADDRESS,

    // Network
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    privateKey: PRIVATE_KEY,

    // Vesting schedule
    yearlyMintRate: '100000000', // 100M tokens/year inflation
    vestingDuration: 4 * 365 * 24 * 60 * 60, // 4 years
    vestingRecipients: [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
    ],
    vestingAmounts: [
      '1000000000', // 1B tokens to recipient 1
      '1000000000', // 1B tokens to recipient 2
    ],

    // No governance
    useGovernance: false,
  };

  console.log('🚀 Launching advanced token with vesting...');

  const launchpad = new DopplerLaunchpad(config);
  const result = await launchpad.launchToken();

  console.log('✅ Advanced token launched with vesting!');
  return result;
}

async function exampleUSDCPairedLaunch() {
  // USDC address on Base
  const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

  const config: DopplerLaunchpadConfig = {
    name: 'USDC Paired Token',
    symbol: 'UPT',
    totalSupply: '100000000', // 100M tokens
    numTokensToSell: '50000000', // 50M for sale

    duration: 7, // 7 day sale
    epochLength: 7200, // 2 hour epochs

    // Prices in USDC ($)
    startPrice: 0.1, // $0.10
    endPrice: 1.0, // $1.00
    minProceeds: '100000', // $100k USDC
    maxProceeds: '10000000', // $10M USDC

    // Fee addresses
    creatorAddress: CREATOR_ADDRESS,
    lpAddress: LP_POL_ADDRESS,
    protocolAddress: PROTOCOL_ADDRESS,
    integrator: INTEGRATOR_ADDRESS,

    // Network
    chainId: 8453, // Base Mainnet for USDC
    rpcUrl: 'https://mainnet.base.org',
    privateKey: PRIVATE_KEY,

    // Custom quote token
    customQuoteToken: USDC_BASE,
    useGovernance: false,
  };

  console.log('🚀 Launching USDC-paired token...');

  const launchpad = new DopplerLaunchpad(config);
  const result = await launchpad.launchToken();

  console.log('✅ USDC-paired token launched!');
  return result;
}

// Utility function to demonstrate fee validation
function demonstrateFeeValidation() {
  console.log('🔍 Demonstrating fee structure validation...');

  const beneficiaries = DopplerLaunchpad.createStandardFeeConfig(
    CREATOR_ADDRESS,
    LP_POL_ADDRESS,
    PROTOCOL_ADDRESS,
  );

  try {
    DopplerLaunchpad.validateBeneficiaries(beneficiaries);
    console.log('✅ Fee structure is valid');
    console.log('📊 With 3% pool fee, each beneficiary gets:');

    beneficiaries.forEach((beneficiary, index) => {
      const percentage = (Number(beneficiary.shares) / 1e18) * 100;
      const transactionPercentage = (percentage / 100) * 3; // 3% pool fee
      const labels = ['Creator', 'LP (POL)', 'Protocol'];
      console.log(
        `  ${index + 1}. ${labels[index]}: ${percentage.toFixed(2)}% of pool fees = ${transactionPercentage.toFixed(2)}% of transaction volume`,
      );
    });
  } catch (error) {
    console.error('❌ Fee validation failed:', error);
  }
}

// Export examples for use
export {
  demonstrateFeeValidation,
  exampleAdvancedLaunchWithVesting,
  examplePrivateKeyBasedLaunch,
  exampleUSDCPairedLaunch,
  exampleWalletBasedLaunch,
};

// Example usage (uncomment to run)
// async function runExample() {
//   try {
//     demonstrateFeeValidation();
//
//     // Basic launch
//     await exampleBasicLaunch();
//
//     // Advanced launch with vesting
//     // await exampleAdvancedLaunchWithVesting();
//
//     // USDC paired launch
//     // await exampleUSDCPairedLaunch();
//   } catch (error) {
//     console.error('Example failed:', error);
//   }
// }
//
// runExample();
