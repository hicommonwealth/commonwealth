import {
  BeneficiaryData,
  DOPPLER_V4_ADDRESSES,
  DopplerPreDeploymentConfig,
  ReadWriteFactory,
  V4MigratorData,
} from 'doppler-v4-sdk';
import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  Hex,
  http,
  parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import ContractBase from './ContractBase';

interface DopplerLaunchpadConfig {
  name: string;
  symbol: string;
  totalSupply: string; // in ether (e.g., "1000000000" for 1B tokens)
  numTokensToSell: string; // in ether (e.g., "600000000" for 600M tokens)
  tokenURI?: string;
  startTimeOffset?: number; // Note: Currently not used by SDK - uses fixed 30 second offset
  duration: number; // Duration in days
  epochLength: number; // Epoch length in seconds
  startPrice: number; // Starting price in ETH
  endPrice: number; // Maximum price in ETH
  minProceeds: string; // Minimum proceeds in ETH
  maxProceeds: string; // Maximum proceeds in ETH
  yearlyMintRate?: string; // Yearly inflation rate in tokens
  vestingDuration?: number; // Vesting duration in seconds
  vestingRecipients?: Address[];
  vestingAmounts?: string[]; // in ether
  integrator: Address; // Still required by Doppler SDK
  creatorAddress: Address;
  lpAddress: Address; // POL address
  protocolAddress: Address;
  useGovernance?: boolean; // Default: false (no-op governance)
  customQuoteToken?: Address; // Optional custom quote token (default: ETH)
  chainId: number;
  rpcUrl?: string; // Optional - only needed for private key mode, wallet mode uses wallet's provider
  privateKey?: Hex; // Optional - if not provided, will use wallet
}

interface DopplerLaunchResult {
  token: Address;
  hook: Address;
  txHash: Hex;
}

class DopplerLaunchpad extends ContractBase {
  private factory: ReadWriteFactory | null = null;
  private addresses: any = null;
  private config: DopplerLaunchpadConfig;

  constructor(config: DopplerLaunchpadConfig) {
    // Use a dummy contract address for ContractBase - we don't use it directly
    // Pass a dummy RPC URL when not provided (wallet mode will use wallet's provider)
    super(
      '0x0000000000000000000000000000000000000000',
      [],
      config.rpcUrl || 'dummy',
    );
    this.config = config;
  }

  private async initializeDopplerFactory(): Promise<void> {
    if (this.factory && this.addresses) {
      return; // Already initialized
    }

    // Get Doppler addresses for the chain
    this.addresses = DOPPLER_V4_ADDRESSES[this.config.chainId];
    if (!this.addresses) {
      throw new Error(
        `Doppler V4 not supported on chain ID: ${this.config.chainId}`,
      );
    }

    // Determine chain configuration
    const chain = this.config.chainId === 8453 ? base : baseSepolia;

    let publicClient: any;
    let walletClient: any;

    if (this.config.privateKey) {
      // Server-side mode: Use private key with provided RPC URL
      if (!this.config.rpcUrl) {
        throw new Error('RPC URL is required when using private key mode');
      }

      const account = privateKeyToAccount(this.config.privateKey);

      publicClient = createPublicClient({
        chain,
        transport: http(this.config.rpcUrl),
      });

      walletClient = createWalletClient({
        chain,
        transport: http(this.config.rpcUrl),
        account,
      });
    } else {
      // Client-side mode: Use the connected wallet's provider
      if (!this.wallet || !this.wallet.enabled) {
        throw new Error('Wallet must be connected for client-side launches');
      }

      // For Ethereum wallets, use the wallet's provider through the api property
      // This works with MetamaskWebWalletController and other EVM wallets
      const walletApi = this.wallet.api;
      if (!walletApi || !walletApi.givenProvider) {
        throw new Error('Wallet API or provider is not available');
      }

      // Use viem's custom transport to connect to the wallet provider
      // This is crucial for viem to actually trigger wallet transactions
      const walletTransport = custom(walletApi.givenProvider);

      // Create viem clients using the wallet's provider transport
      publicClient = createPublicClient({
        chain,
        transport: walletTransport,
      });

      // This is the key - the walletClient uses the wallet's provider for signing
      walletClient = createWalletClient({
        chain,
        transport: walletTransport,
        account: this.wallet.accounts[0] as Address,
      });
    }

    try {
      // Initialize Doppler factory with viem clients
      this.factory = new ReadWriteFactory(
        this.addresses.airlock,
        { publicClient, walletClient } as any, // Type assertion to bypass drift issues
      );
    } catch (error) {
      console.error('Failed to initialize Doppler factory:', error);
      throw new Error(`Failed to initialize Doppler factory: ${error.message}`);
    }
  }

  // Override initialize to handle Doppler-specific initialization
  async initialize(
    withWallet: boolean = false,
    chainId?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ): Promise<void> {
    // Initialize the base contract (for wallet management)
    await super.initialize(
      withWallet,
      chainId || this.config.chainId.toString(),
      providerInstance,
    );

    // Initialize Doppler factory
    await this.initializeDopplerFactory();
  }

  // Method to launch with wallet (client-side)
  async launchTokenWithWallet(chainId?: string): Promise<DopplerLaunchResult> {
    await this.initialize(true, chainId || this.config.chainId.toString());
    return this.launchToken();
  }

  // Method to launch with private key (server-side)
  async launchTokenWithPrivateKey(): Promise<DopplerLaunchResult> {
    if (!this.config.privateKey) {
      throw new Error('Private key is required for server-side launches');
    }
    await this.initializeDopplerFactory();
    return this.launchToken();
  }

  private createBeneficiaries(): BeneficiaryData[] {
    // Fee Structure: Each beneficiary gets 1% of transaction volume
    // Implementation: 3% pool fee split equally among 3 beneficiaries
    // Result: 3% ÷ 3 = 1% of transaction volume per beneficiary
    const beneficiaries: BeneficiaryData[] = [
      {
        beneficiary: this.config.creatorAddress,
        shares: BigInt(Math.floor(1e18 / 3)), // 33.3333% of pool fees = 1% of transactions
      },
      {
        beneficiary: this.config.lpAddress,
        shares: BigInt(Math.floor(1e18 / 3)), // 33.3333% of pool fees = 1% of transactions
      },
      {
        beneficiary: this.config.protocolAddress,
        shares: BigInt(Math.floor(1e18 / 3)), // 33.3333% of pool fees = 1% of transactions
      },
    ];

    // Add any remainder to the first beneficiary to ensure total equals 1e18
    const totalShares = beneficiaries.reduce(
      (sum, b) => sum + b.shares,
      BigInt(0),
    );
    const remainder = BigInt(1e18) - totalShares;
    beneficiaries[0].shares += remainder;

    // Sort beneficiaries as required by contract
    return this.factory!.sortBeneficiaries(beneficiaries);
  }

  private createV4MigratorConfig(): V4MigratorData {
    const sortedBeneficiaries = this.createBeneficiaries();

    return {
      fee: 3000, // 0.3% pool fee
      tickSpacing: 60, // Standard for 0.3% pools
      lockDuration: this.config.useGovernance
        ? 180 * 24 * 60 * 60 // 180 days for standard governance
        : 0, // Duration ignored for no-op governance (permanent lock)
      beneficiaries: sortedBeneficiaries,
    };
  }

  private async createPreDeploymentConfig(): Promise<DopplerPreDeploymentConfig> {
    const v4Config = this.createV4MigratorConfig();
    const liquidityMigratorData =
      await this.factory!.encodeV4MigratorData(v4Config);

    const config: DopplerPreDeploymentConfig = {
      // Token details
      name: this.config.name,
      symbol: this.config.symbol,
      totalSupply: parseEther(this.config.totalSupply),
      numTokensToSell: parseEther(this.config.numTokensToSell),
      tokenURI: this.config.tokenURI || '',

      // Timing
      blockTimestamp: Math.floor(Date.now() / 1000),
      duration: this.config.duration,
      epochLength: this.config.epochLength,

      // Additional required fields for Doppler SDK
      gamma: 800, // Default gamma value for bonding curve
      numPdSlugs: 15, // Default number of price discovery slugs

      // Tick range configuration
      tickRange: {
        startTick: 174_312, // Default tick range for price discovery
        endTick: 186_840,
      },

      // Price configuration
      priceRange: {
        startPrice: this.config.startPrice,
        endPrice: this.config.endPrice,
      },
      tickSpacing: 60,
      fee: 3000, // 0.3%

      // Sale parameters
      minProceeds: parseEther(this.config.minProceeds),
      maxProceeds: parseEther(this.config.maxProceeds),

      // Vesting (optional)
      yearlyMintRate: this.config.yearlyMintRate
        ? parseEther(this.config.yearlyMintRate)
        : BigInt(0),
      vestingDuration: this.config.vestingDuration
        ? BigInt(this.config.vestingDuration)
        : BigInt(0),
      recipients: this.config.vestingRecipients || [],
      amounts:
        this.config.vestingAmounts?.map((amount) => parseEther(amount)) || [],

      // Migration and fees
      liquidityMigratorData,
      integrator: this.config.integrator,

      // Custom quote token (optional)
      ...(this.config.customQuoteToken && {
        numeraire: this.config.customQuoteToken,
      }),
    };

    return config;
  }

  async launchToken(): Promise<DopplerLaunchResult> {
    try {
      // Ensure factory is initialized
      if (!this.factory || !this.addresses) {
        throw new Error(
          'Doppler factory not initialized. Call initialize() or launchTokenWithWallet() first.',
        );
      }

      // Build configuration
      const preDeploymentConfig = await this.createPreDeploymentConfig();

      const { createParams, hook, token } = await this.factory.buildConfig(
        preDeploymentConfig,
        this.addresses,
        {
          useGovernance: this.config.useGovernance ?? false, // Default to no-op governance
        },
      );

      console.log('Token will be deployed at:', token);
      console.log('Hook will be deployed at:', hook);
      console.log(
        'Sale will start at:',
        new Date((Math.floor(Date.now() / 1000) + 30) * 1000),
      ); // 30 seconds offset

      // Create the pool
      const txHash = await this.factory.create(createParams);
      console.log('Transaction hash:', txHash);

      return {
        token,
        hook,
        txHash,
      };
    } catch (error) {
      console.error('Error launching Doppler token:', error);
      throw error;
    }
  }

  // Static helper method to validate beneficiary configuration
  static validateBeneficiaries(beneficiaries: BeneficiaryData[]): boolean {
    // Check if shares sum to exactly 1e18 (100%)
    const totalShares = beneficiaries.reduce(
      (sum, b) => sum + b.shares,
      BigInt(0),
    );
    if (totalShares !== BigInt(1e18)) {
      throw new Error(
        `Total beneficiary shares must equal 1e18, got ${totalShares}`,
      );
    }

    // Check for duplicate addresses
    const addresses = beneficiaries.map((b) => b.beneficiary);
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      throw new Error('Duplicate beneficiary addresses are not allowed');
    }

    // Check if sorted
    for (let i = 1; i < beneficiaries.length; i++) {
      if (beneficiaries[i].beneficiary < beneficiaries[i - 1].beneficiary) {
        throw new Error(
          'Beneficiaries must be sorted by address in ascending order',
        );
      }
    }

    return true;
  }

  // Static helper method for creating standard fee configuration
  static createStandardFeeConfig(
    creatorAddress: Address,
    lpAddress: Address,
    protocolAddress: Address,
  ): BeneficiaryData[] {
    // Each beneficiary gets 1/3 of the pool fees (33.33% each)
    // With a 3% pool fee, this means each gets 1% of transaction volume
    const beneficiaries = [
      {
        beneficiary: creatorAddress,
        shares: BigInt(Math.floor(1e18 / 3)), // 1/3 of pool fees
      },
      {
        beneficiary: lpAddress,
        shares: BigInt(Math.floor(1e18 / 3)), // 1/3 of pool fees
      },
      {
        beneficiary: protocolAddress,
        shares: BigInt(Math.floor(1e18 / 3)), // 1/3 of pool fees
      },
    ];

    // Add any remainder to ensure total equals exactly 1e18
    const totalShares = beneficiaries.reduce(
      (sum, b) => sum + b.shares,
      BigInt(0),
    );
    const remainder = BigInt(1e18) - totalShares;
    beneficiaries[0].shares += remainder;

    return beneficiaries;
  }

  // Getter for deployed addresses (after initialization)
  get dopplerAddresses() {
    return this.addresses;
  }

  // Get the current wallet address
  getWalletAddress(): Address | null {
    if (this.config.privateKey) {
      return privateKeyToAccount(this.config.privateKey).address;
    } else if (this.wallet && this.wallet.accounts.length > 0) {
      return this.wallet.accounts[0] as Address;
    }
    return null;
  }

  // Check if wallet is connected and ready
  isWalletReady(): boolean {
    return this.config.privateKey
      ? true
      : this.walletEnabled && this.wallet?.accounts.length > 0;
  }
}

export default DopplerLaunchpad;
export type { DopplerLaunchpadConfig, DopplerLaunchResult };
