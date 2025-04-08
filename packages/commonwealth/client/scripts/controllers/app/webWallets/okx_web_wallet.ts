declare let window: any;

import { SIWESigner } from '@canvas-js/chain-ethereum';
import { SolanaSigner } from '@canvas-js/chain-solana';
import { SessionSigner } from '@canvas-js/interfaces';
import {
  ChainBase,
  ChainNetwork,
  SOLANA_MAINNET_CHAIN_ID,
  WalletId,
} from '@hicommonwealth/shared';
import { hexToNumber } from 'web3-utils';
import BlockInfo from '../../../models/BlockInfo';
import IWebWallet from '../../../models/IWebWallet';

class OKXWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled = false;
  private _enabling = false;
  private _accounts: string[] = [];
  private _provider: any = null;
  private _chainType: ChainBase = ChainBase.Ethereum; // Default to Ethereum

  public readonly name = WalletId.OKX;
  public readonly label = 'OKX Wallet';
  public readonly chain = ChainBase.Ethereum; // Default to Ethereum
  public readonly defaultNetwork = ChainNetwork.Ethereum;

  // OKX wallet supports both Ethereum and Solana
  public readonly specificChains = [ChainBase.Ethereum, ChainBase.Solana];

  constructor() {
    console.log('OKX Wallet Controller initialized');
  }

  public get available() {
    // Check if OKX wallet is installed
    const isAvailable =
      typeof window !== 'undefined' && window.okxwallet !== undefined;
    console.log('OKX wallet available:', isAvailable);
    return isAvailable;
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
    return this._provider;
  }

  public getChainId() {
    if (this._chainType === ChainBase.Solana) {
      return SOLANA_MAINNET_CHAIN_ID;
    }

    // For Ethereum, get the current chain ID from the provider
    return this._provider?.chainId?.toString() || '1';
  }

  public async getRecentBlock(
    chainIdentifier: string,
  ): Promise<BlockInfo | null> {
    if (this._chainType === ChainBase.Solana) {
      return null; // Solana implementation could be added here
    }

    // Ethereum implementation
    try {
      const block = await this._provider.request({
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      });

      return {
        number: Number(hexToNumber(block.number)),
        hash: block.hash,
        timestamp: Number(hexToNumber(block.timestamp)),
      };
    } catch (error) {
      console.error('Error getting recent block:', error);
      return null;
    }
  }

  public getSessionSigner(): SessionSigner {
    if (this._chainType === ChainBase.Solana) {
      return new SolanaSigner({
        signer: this._provider,
        chainId: this.getChainId(),
      });
    }

    // Default to Ethereum
    return new SIWESigner({
      signer: {
        signMessage: (message) =>
          this._provider.request({
            method: 'personal_sign',
            params: [this.accounts[0], message],
          }),
        getAddress: () => this.accounts[0],
      },
      chainId: parseInt(this.getChainId()),
    });
  }

  // ACTIONS
  public async enable(forceChainId?: string) {
    console.log(
      'Attempting to enable OKX wallet with forceChainId:',
      forceChainId,
    );
    this._enabling = true;

    if (!this.available) {
      this._enabling = false;
      console.error('OKX wallet not installed!');
      throw new Error('OKX wallet not installed!');
    }

    try {
      // Determine if we're connecting to Ethereum or Solana
      const chainType = forceChainId?.startsWith('solana:')
        ? ChainBase.Solana
        : ChainBase.Ethereum;

      console.log('Connecting to chain type:', chainType);
      this._chainType = chainType;

      if (chainType === ChainBase.Solana) {
        // Connect to Solana
        try {
          if (!window.okxwallet.solana) {
            console.error('OKX Solana provider not available');
            throw new Error('OKX Solana provider not available');
          }

          console.log('Connecting to OKX Solana provider');
          // Connect to Solana provider
          const resp = await window.okxwallet.solana.connect();
          const publicKey =
            typeof resp.publicKey === 'function'
              ? (await resp.publicKey()).toString()
              : resp.publicKey.toString();

          console.log('Connected to OKX Solana with public key:', publicKey);
          this._accounts = [publicKey];
          this._provider = window.okxwallet.solana;
        } catch (err) {
          this._enabling = false;
          console.error('Could not connect to OKX Solana wallet:', err);
          throw new Error(
            'Could not connect to OKX Solana wallet: ' + (err.message || err),
          );
        }
      } else {
        // Connect to Ethereum
        try {
          if (!window.okxwallet.ethereum) {
            console.error('OKX Ethereum provider not available');
            throw new Error('OKX Ethereum provider not available');
          }

          console.log('Connecting to OKX Ethereum provider');
          // Connect to Ethereum provider
          this._provider = window.okxwallet.ethereum;

          // Request accounts
          console.log('Requesting accounts from OKX Ethereum provider');
          const accounts = await this._provider.request({
            method: 'eth_requestAccounts',
          });

          if (accounts && accounts.length > 0) {
            console.log(
              'Received accounts from OKX Ethereum provider:',
              accounts,
            );
            this._accounts = accounts;
          } else {
            console.error('No accounts found in OKX wallet');
            throw new Error('No accounts found in OKX wallet');
          }

          // Switch to specified chain if necessary
          if (forceChainId) {
            const chainIdNum = parseInt(
              forceChainId.replace('eip155:', ''),
              10,
            );
            const chainIdHex = `0x${chainIdNum.toString(16)}`;

            try {
              console.log(`Switching to chain ID ${chainIdNum}`);
              await this._provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
              });
            } catch (switchError) {
              // Chain not added to the wallet
              console.error('Error switching chain:', switchError);
              throw new Error(`Failed to switch to chain ID ${chainIdNum}`);
            }
          }
        } catch (err) {
          this._enabling = false;
          console.error('Could not connect to OKX Ethereum wallet:', err);
          throw new Error(
            'Could not connect to OKX Ethereum wallet: ' + (err.message || err),
          );
        }
      }

      console.log('OKX wallet enabled successfully');
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      this._enabling = false;
      console.error('Error enabling OKX wallet:', error);
      throw error;
    }
  }

  public async switchNetwork(chainId?: string) {
    if (!this._enabled) {
      throw new Error('OKX wallet not enabled');
    }

    if (this._chainType === ChainBase.Solana) {
      // Solana doesn't have network switching in the same way as Ethereum
      return;
    }

    // For Ethereum
    if (chainId) {
      const chainIdNum = parseInt(chainId, 10);
      const chainIdHex = `0x${chainIdNum.toString(16)}`;

      try {
        await this._provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } catch (error) {
        throw new Error(
          `Failed to switch to chain ID ${chainIdNum}: ${error.message}`,
        );
      }
    }
  }
}

// Export the class directly
export default OKXWebWalletController;
