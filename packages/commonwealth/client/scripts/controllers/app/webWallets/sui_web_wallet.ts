// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any;

import {
  ChainBase,
  ChainNetwork,
  SUI_MAINNET_CHAIN_ID,
  WalletId,
} from '@hicommonwealth/shared';
import IWebWallet from '../../../models/IWebWallet';

class SuiWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled = false;
  private _enabling = false;
  private _accounts: string[] = [];
  private _currentWallet: any = null;

  public readonly name = WalletId.SuiWallet;
  public readonly label = 'Sui Wallet';
  public readonly chain = ChainBase.Sui;
  public readonly defaultNetwork = ChainNetwork.Sui;

  // Check if any Wallet Standard compatible wallets are available
  public get available() {
    try {
      if (typeof window === 'undefined') return false;
      // Check if wallet-standard registry exists
      return (
        typeof window.walletStandard !== 'undefined' ||
        (typeof window.sui !== 'undefined' &&
          typeof window.sui.wallet !== 'undefined')
      );
    } catch (e) {
      console.error('Error checking Sui wallet availability:', e);
      return false;
    }
  }

  public get enabled() {
    return this.available && this._enabled;
  }

  public get enabling() {
    return this._enabling;
  }

  public get accounts() {
    return this._accounts || [];
  }

  public getChainId() {
    return SUI_MAINNET_CHAIN_ID;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  public async getRecentBlock(chainIdentifier: string) {
    return null;
  }

  public getSessionSigner() {
    return {
      chainId: this.getChainId(),
      address: this._accounts[0] || '',
      signMessage: async (message: string) => {
        if (!this.available || !this._enabled || !this._currentWallet) {
          throw new Error('Sui wallet not connected');
        }

        try {
          // Ensure the wallet supports the signPersonalMessage feature
          if (!this._currentWallet.features?.['sui:signPersonalMessage']) {
            throw new Error(
              'Current wallet does not support signing personal messages',
            );
          }

          // Convert message to Uint8Array if it's a string
          const messageBytes =
            typeof message === 'string'
              ? new TextEncoder().encode(message)
              : message;

          // Use the wallet's signPersonalMessage method
          const response = await this._currentWallet.features[
            'sui:signPersonalMessage'
          ].signPersonalMessage({
            message: messageBytes,
            account: this._currentWallet.accounts[0],
          });

          return {
            signature: response.signature,
            publicKey: this._currentWallet.accounts[0].publicKey,
          };
        } catch (error) {
          console.error('Error signing message with Sui wallet:', error);
          throw error;
        }
      },
    };
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Sui Wallet');
    this._enabling = true;

    if (!this.available) {
      this._enabling = false;
      throw new Error(
        'No Sui wallet available! Please install a Sui-compatible wallet.',
      );
    }

    try {
      // Get available wallets using the wallet-standard
      let wallets: any[] = [];

      if (window.walletStandard) {
        wallets = window.walletStandard.get();
      } else if (window.sui?.wallet) {
        // Fallback for older wallet implementations
        wallets = [window.sui.wallet];
      }

      if (!wallets.length) {
        this._enabling = false;
        throw new Error('No Sui wallets found');
      }

      // Find the first Sui-compatible wallet
      const suiWallet = wallets.find((wallet) =>
        wallet.chains?.some((chain: string) => chain.startsWith('sui:')),
      );

      if (!suiWallet) {
        this._enabling = false;
        throw new Error('No Sui-compatible wallets found');
      }

      this._currentWallet = suiWallet;

      // Connect to the wallet
      if (suiWallet.features?.['standard:connect']) {
        await suiWallet.features['standard:connect'].connect();
      }

      // Get the accounts
      if (suiWallet.accounts?.length) {
        this._accounts = suiWallet.accounts.map(
          (account: any) => account.address,
        );
      } else {
        this._enabling = false;
        throw new Error('No accounts available in the Sui wallet');
      }

      // Setup event listeners for when accounts change
      if (suiWallet.features?.['standard:events']) {
        suiWallet.features['standard:events'].on('change', (event: any) => {
          if (event.accounts?.length) {
            this._accounts = event.accounts.map(
              (account: any) => account.address,
            );
          }
        });
      }

      this._enabling = false;
      this._enabled = true;
    } catch (err) {
      this._enabling = false;
      console.error('Error connecting to Sui wallet:', err);
      throw new Error(
        'Could not connect to Sui wallet. Please make sure it is installed and unlocked.',
      );
    }
  }

  // Optional reset method to disconnect
  public async reset() {
    if (this._currentWallet?.features?.['standard:disconnect']) {
      try {
        await this._currentWallet.features['standard:disconnect'].disconnect();
      } catch (error) {
        console.error('Error disconnecting from Sui wallet:', error);
      }
    }

    this._currentWallet = null;
    this._accounts = [];
    this._enabled = false;
  }
}

export default SuiWebWalletController;
