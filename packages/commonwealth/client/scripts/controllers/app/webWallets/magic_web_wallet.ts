import { SIWESigner } from '@canvas-js/chain-ethereum';
import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import { Magic } from 'magic-sdk';
import app from 'state';
import { fetchCachedPublicEnvVar } from 'state/api/configuration';
import { userStore } from 'state/ui/user';
import { getMagicForChain, isMagicUser } from 'utils/magicNetworkUtils';
import { hexToNumber } from 'web3-utils';
import BlockInfo from '../../../models/BlockInfo';
import IWebWallet from '../../../models/IWebWallet';

declare let window: any;

/**
 * Magic Web Wallet Controller
 *
 * This controller enables Magic wallets to be used for transaction signing in the Commonwealth app.
 * Magic wallets are non-custodial wallets that users create through social login (Google, Discord, etc.)
 *
 * Key features:
 * - Only available to users already authenticated with Magic (checked via isMagicUser())
 * - Uses Magic's RPC provider for transaction signing
 * - Integrates with ContractBase.ts for EVM contract interactions
 * - Supports the same IWebWallet interface as MetaMask and other wallets
 *
 * Integration Flow:
 * 1. User signs in with Magic through the existing authentication flow (NOT through this wallet)
 * 2. Backend creates Account with walletId = WalletId.Magic and stores in user store
 * 3. When transaction needed, ContractBase calls WebWalletController.locateWallet()
 * 4. locateWallet() sees account.walletId = 'magic' and calls getByName('magic')
 * 5. This returns the Magic Web Wallet Controller instance
 * 6. Controller enables using Magic addresses from user store + Magic RPC provider
 * 7. Transactions are signed through Magic's provider (magic.rpcProvider)
 *
 * NOTE: This wallet is NOT used for authentication - only for transaction signing!
 */

class MagicWebWalletController implements IWebWallet<string> {
  private _enabled: boolean = false;
  private _enabling = false;
  private _accounts: string[] = [];
  private _magic: Magic | null = null;
  private _provider: any;

  public readonly name = WalletId.Magic;
  public readonly label = 'Magic Wallet';
  public readonly defaultNetwork = ChainNetwork.Ethereum;
  public readonly chain = ChainBase.Ethereum;

  public get available() {
    const { MAGIC_PUBLISHABLE_KEY } = fetchCachedPublicEnvVar() || {};
    // Magic wallet is available if:
    // 1. Magic publishable key is configured
    // 2. Either user is a Magic user OR there are accounts with Magic wallet ID in store
    const userHasMagicAccounts = userStore
      .getState()
      .addresses?.some((addr) => addr.walletId === WalletId.Magic);
    return !!MAGIC_PUBLISHABLE_KEY && (isMagicUser() || userHasMagicAccounts);
  }

  public get provider() {
    return this._provider;
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

  public get api() {
    return {
      givenProvider: this._provider,
    };
  }

  public getChainId() {
    return app.chain?.meta?.ChainNode?.eth_chain_id?.toString() || '1';
  }

  public async getRecentBlock(chainIdentifier: string): Promise<BlockInfo> {
    if (!this._provider) {
      throw new Error('Magic provider not initialized');
    }

    const block = await this._provider.request({
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    });

    return {
      number: Number(hexToNumber(block.number)),
      hash: block.hash,
      timestamp: Number(hexToNumber(block.timestamp)),
    };
  }

  public getSessionSigner() {
    return new SIWESigner({
      signer: {
        signMessage: (message) => {
          if (!this._provider) {
            throw new Error('Magic provider not initialized');
          }
          return this._provider.request({
            method: 'personal_sign',
            params: [message, this.accounts[0]],
          });
        },
        getAddress: () => this.accounts[0],
      },
      chainId: parseInt(this.getChainId()),
    });
  }

  public async enable(forceChainId?: string) {
    console.log('Attempting to enable Magic wallet');
    this._enabling = true;

    try {
      const chainId = forceChainId ?? this.getChainId();

      // Get Magic instance for the chain
      this._magic = getMagicForChain(parseInt(chainId));
      if (!this._magic) {
        throw new Error('Unable to initialize Magic for this chain');
      }

      // For Magic, we get the accounts from the user store rather than trying to authenticate
      // The user should already be authenticated through the login flow
      const userMagicAddresses = userStore
        .getState()
        .addresses?.filter((addr) => addr.walletId === WalletId.Magic);

      if (!userMagicAddresses || userMagicAddresses.length === 0) {
        throw new Error('No Magic addresses found in user store');
      }

      // Use the addresses from the user store
      this._accounts = userMagicAddresses.map((addr) => addr.address);

      // Verify that Magic is still authenticated for at least one of these addresses
      try {
        const userInfo = await this._magic.user.getInfo();
        const userMetadata = await this._magic.user.getMetadata();

        // Check if the authenticated Magic address matches one of the user's addresses
        if (
          userMetadata.publicAddress &&
          !this._accounts.includes(userMetadata.publicAddress)
        ) {
          console.warn(
            'Magic authenticated address does not match user store addresses',
          );
          // Still continue, but use the authenticated address
          this._accounts = [userMetadata.publicAddress];
        }
      } catch (error) {
        // If Magic is not authenticated, we can still proceed with the addresses from the store
        // The transaction signing will fail if Magic is not actually authenticated
        console.warn(
          'Magic user info not available, proceeding with stored addresses',
        );
      }

      // Set up the provider for transaction signing
      this._provider = this._magic.rpcProvider;
      this._enabled = true;
      this._enabling = false;

      await this.initAccountsChanged();
      console.log(
        `Enabled Magic wallet for addresses: ${this._accounts.join(', ')}`,
      );
    } catch (error) {
      console.error('Failed to enable Magic wallet:', error);
      this._enabling = false;
      throw new Error(`Failed to enable Magic wallet: ${error.message}`);
    }
  }

  public async switchNetwork(chainId?: string) {
    if (!chainId) return;

    try {
      // Magic handles network switching by recreating the instance
      const newMagic = getMagicForChain(parseInt(chainId));
      if (newMagic) {
        this._magic = newMagic;
        this._provider = newMagic.rpcProvider;
        console.log(`Switched Magic wallet to chain ID: ${chainId}`);
      }
    } catch (error) {
      console.error('Error switching Magic network:', error);
    }
  }

  public async initAccountsChanged() {
    // Magic doesn't have traditional account change events like MetaMask
    // But we can listen for login state changes if needed
    if (this._magic) {
      try {
        // Check if user is still logged in periodically or on focus
        const checkLoginState = async () => {
          try {
            const userInfo = await this._magic!.user.getInfo();
            if (!userInfo) {
              // User logged out, reset state
              this._enabled = false;
              this._accounts = [];
              this._provider = null;
            }
          } catch (error) {
            // User logged out or error occurred
            this._enabled = false;
            this._accounts = [];
            this._provider = null;
          }
        };

        // Check on window focus
        window.addEventListener('focus', checkLoginState);
      } catch (error) {
        console.warn(
          'Could not set up Magic account change monitoring:',
          error,
        );
      }
    }
  }

  public async reset() {
    if (this._magic) {
      try {
        await this._magic.user.logout();
      } catch (error) {
        console.warn('Error during Magic logout:', error);
      }
    }

    this._enabled = false;
    this._accounts = [];
    this._provider = null;
    this._magic = null;
  }

  // Additional method to open Magic wallet UI (similar to openMagicWallet in useAuthentication)
  public async openWalletUI() {
    if (!this._magic) {
      const chainId = this.getChainId();
      this._magic = getMagicForChain(parseInt(chainId));
    }

    if (this._magic) {
      try {
        await this._magic.wallet.showUI();
      } catch (error) {
        console.error('Error opening Magic wallet UI:', error);
        throw error;
      }
    } else {
      throw new Error('Magic not initialized');
    }
  }
}

export default MagicWebWalletController;
