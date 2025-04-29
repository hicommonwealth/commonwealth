// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any;

// Using a more generic type since @canvas-js/chain-sui might not be available
import { Awaitable, SessionSigner } from '@canvas-js/interfaces';
import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import type { WalletAccount } from '@mysten/wallet-standard';
import { getWallets } from '@mysten/wallet-standard';
import BlockInfo from '../../../models/BlockInfo';
import IWebWallet from '../../../models/IWebWallet';

// Define interface for the wallet from @mysten/wallet-standard
interface Wallet {
  name: string;
  icon?: string;
  chains: string[];
  accounts: WalletAccount[];
  features: {
    'standard:connect': {
      connect(): Promise<{ accounts: WalletAccount[] }>;
      version: string;
    };
    'sui:signPersonalMessage'?: {
      version: string;
      signPersonalMessage(params: {
        message: Uint8Array;
        account: WalletAccount;
      }): Promise<{ signature: Uint8Array }>;
    };
    [key: string]: unknown;
  };
}

class SuiWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled = false;
  private _enabling = false;
  private _accounts: string[] = [];
  private _wallet: Wallet | null = null;

  public readonly name = WalletId.SuiWallet;
  public readonly label = 'Sui Wallet';
  public readonly chain = ChainBase.Sui;
  public readonly defaultNetwork = ChainNetwork.Sui;

  // According to the Sui Wallet Standard, wallets should register themselves
  public get available() {
    const availableWallets = getWallets().get();
    if (availableWallets.length > 0) {
      return true;
    }
    return false;
  }

  public get enabled() {
    return this.available && this._enabled;
  }

  public get enabling() {
    return this._enabling;
  }

  public get accounts() {
    return this._accounts;
  }

  public getChainId() {
    // Define the Sui mainnet chain ID
    return '0x0000000000000000000000000000000000000000000000000000000000000000'; // Sui mainnet chain ID
  }

  // Get the best available Sui wallet provider
  private getSuiWalletProvider(): Wallet | null {
    const availableWallets = getWallets().get() as unknown[] as Wallet[];

    if (availableWallets.length === 0) {
      console.log('No Sui wallets available');
      return null;
    }

    // Filter wallets that support Sui chains and standard:connect feature
    const compatibleWallets = availableWallets.filter((wallet) => {
      const hasSuiChain = wallet.chains.some((chain) =>
        chain.startsWith('sui:'),
      );
      const hasConnectFeature = 'standard:connect' in wallet.features;
      return hasSuiChain && hasConnectFeature;
    });

    if (compatibleWallets.length === 0) {
      console.log('No compatible Sui wallets found');
      return null;
    }

    // Prioritize known wallet names if multiple are available
    const walletPriority = [
      'Sui Wallet',
      'Ethos Wallet',
      'Martian Wallet',
      'Suiet',
    ];

    for (const priorityName of walletPriority) {
      const priorityWallet = compatibleWallets.find((w) =>
        w.name.toLowerCase().includes(priorityName.toLowerCase()),
      );
      if (priorityWallet) return priorityWallet;
    }

    // If no priority wallet found, return the first compatible wallet
    return compatibleWallets[0];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  public async getRecentBlock(
    chainIdentifier: string,
  ): Promise<BlockInfo | null> {
    return null;
  }

  public getSessionSigner(): Awaitable<SessionSigner> {
    // Currently we don't have a proper Sui chain SessionSigner implementation in Canvas.js
    // Return a minimal object that satisfies the TypeScript interface while acknowledging
    // that a proper implementation would be needed for full functionality

    const chainId = this.getChainId() || '';
    const address = this._accounts[0] || '';

    // Create a simple placeholder that satisfies the type checker
    // In a real implementation, this would need to be replaced with a proper SessionSigner
    // implementation for Sui wallets
    const placeholderSigner = {
      chainId,
      wallet: this._wallet,
      address,

      // Note: This is a placeholder implementation only to satisfy the type system
      // A real implementation would need proper Canvas.js integration
    } as unknown as SessionSigner;

    // When Canvas.js adds direct Sui support, this method should be updated to use
    // the proper implementation (similar to SolanaSigner, CosmosSigner, etc.)
    return placeholderSigner;
  }

  /**
   * Helper method to sign personal messages
   * Not part of the IWebWallet interface but can be useful for applications
   */
  public async signPersonalMessage(
    message: Uint8Array | string,
  ): Promise<{ signature: Uint8Array }> {
    if (!this._wallet || !this._wallet.accounts.length) {
      throw new Error('Wallet not connected');
    }

    if (!this._wallet.features['sui:signPersonalMessage']) {
      throw new Error('Wallet does not support signPersonalMessage');
    }

    const signMessageFeature = this._wallet.features['sui:signPersonalMessage'];

    // Convert string message to Uint8Array if needed
    const messageBytes =
      typeof message === 'string' ? new TextEncoder().encode(message) : message;

    // Sign the message with the first connected account
    try {
      return await signMessageFeature.signPersonalMessage({
        message: messageBytes,
        account: this._wallet.accounts[0],
      });
    } catch (error) {
      console.error('Error signing personal message with Sui Wallet:', error);
      throw new Error(
        `Failed to sign message with Sui Wallet: ${error.message || 'Unknown error'}`,
      );
    }
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Sui Wallet');
    this._enabling = true;

    const walletProvider = this.getSuiWalletProvider();

    if (!walletProvider) {
      this._enabling = false;
      throw new Error('Sui Wallet not installed!');
    }

    try {
      // Store wallet reference for later use in getSessionSigner
      this._wallet = walletProvider;

      // Use the standard:connect feature as per the Wallet Standard
      if ('standard:connect' in walletProvider.features) {
        // Get the connect feature and call it
        const connectResult =
          await walletProvider.features['standard:connect'].connect();
        console.log('Connected to wallet:', walletProvider.name);

        // After connection, the accounts should be populated
        if (connectResult.accounts && connectResult.accounts.length > 0) {
          // Extract addresses from wallet accounts
          const addresses = connectResult.accounts.map(
            (account) => account.address,
          );
          console.log('Wallet accounts:', addresses);

          this._accounts = addresses;
          this._enabled = true;
        } else if (
          walletProvider.accounts &&
          walletProvider.accounts.length > 0
        ) {
          // Fallback to wallet.accounts if connectResult doesn't have accounts
          const addresses = walletProvider.accounts.map(
            (account) => account.address,
          );
          console.log('Wallet accounts (from wallet):', addresses);

          this._accounts = addresses;
          this._enabled = true;
        } else {
          throw new Error('No accounts found after connecting to wallet');
        }
      } else {
        throw new Error('Wallet does not support the standard:connect feature');
      }

      this._enabling = false;
    } catch (err) {
      this._enabling = false;
      this._wallet = null;
      console.error('Error connecting to Sui wallet:', err);
      throw new Error(
        'Could not connect to Sui Wallet: ' + (err.message || 'Unknown error'),
      );
    }
  }
}

export default SuiWebWalletController;
