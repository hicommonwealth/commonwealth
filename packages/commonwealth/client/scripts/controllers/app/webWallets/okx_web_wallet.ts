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
import app from 'state';
import { hexToNumber } from 'web3-utils';
import BlockInfo from '../../../models/BlockInfo';
import IWebWallet from '../../../models/IWebWallet';

class OKXWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled = false;
  private _enabling = false;
  private _accounts: string[] = [];
  private _chainType: ChainBase = ChainBase.Ethereum; // Default to Ethereum

  public readonly name = WalletId.OKX;
  public readonly label = 'OKX Wallet';
  public readonly chain = ChainBase.Ethereum; // Default to Ethereum
  public readonly defaultNetwork = ChainNetwork.Ethereum;

  // OKX wallet supports both Ethereum and Solana
  public readonly specificChains = [ChainBase.Ethereum, ChainBase.Solana];

  constructor() {
    console.log('[OKXWebWallet] Constructor initialized');
  }

  public get available() {
    const isAvailable =
      this._chainType === ChainBase.Solana
        ? typeof window !== 'undefined' &&
          !!window.okxwallet &&
          !!window.okxwallet.solana
        : typeof window !== 'undefined' &&
          !!window.okxwallet &&
          !!window.okxwallet.ethereum;

    console.log(
      `[OKXWebWallet] available check: ${isAvailable}, window.okxwallet exists: ${typeof window !== 'undefined' && !!window.okxwallet}`,
    );
    return isAvailable;
  }

  public get enabled() {
    console.log(
      `[OKXWebWallet] enabled check: ${this.available && this._enabled}`,
    );
    return this.available && this._enabled;
  }

  public get enabling() {
    console.log(`[OKXWebWallet] enabling check: ${this._enabling}`);
    return this._enabling;
  }

  public get accounts() {
    console.log(
      `[OKXWebWallet] accounts check: ${JSON.stringify(this._accounts)}`,
    );
    return this._accounts || [];
  }

  public get api() {
    const provider =
      this._chainType === ChainBase.Solana
        ? window.okxwallet?.solana
        : window.okxwallet?.ethereum;
    console.log(`[OKXWebWallet] api provider: ${!!provider}`);
    return provider;
  }

  public getChainId() {
    if (this._chainType === ChainBase.Solana) {
      console.log(
        `[OKXWebWallet] getChainId returning Solana ID: ${SOLANA_MAINNET_CHAIN_ID}`,
      );
      return SOLANA_MAINNET_CHAIN_ID;
    }

    // For Ethereum, get the current chain ID from the app or default to mainnet
    const chainId = app.chain?.meta?.ChainNode?.eth_chain_id?.toString() || '1';
    console.log(`[OKXWebWallet] getChainId returning Ethereum ID: ${chainId}`);
    return chainId;
  }

  public async getRecentBlock(
    chainIdentifier: string,
  ): Promise<BlockInfo | null> {
    console.log(
      `[OKXWebWallet] getRecentBlock called for chain: ${chainIdentifier}`,
    );

    if (this._chainType === ChainBase.Solana) {
      return null; // Solana implementation could be added here
    }

    try {
      const block = await window.okxwallet.ethereum.request({
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      });

      console.log(`[OKXWebWallet] getRecentBlock success: ${block.hash}`);
      return {
        number: Number(hexToNumber(block.number)),
        hash: block.hash,
        timestamp: Number(hexToNumber(block.timestamp)),
      };
    } catch (error) {
      console.error('[OKXWebWallet] Error getting recent block:', error);
      return null;
    }
  }

  public getSessionSigner(): SessionSigner {
    console.log(
      `[OKXWebWallet] getSessionSigner called for chain type: ${this._chainType}`,
    );

    if (this._chainType === ChainBase.Solana) {
      return new SolanaSigner({
        signer: window.okxwallet.solana,
        chainId: this.getChainId(),
      });
    }

    // Default to Ethereum
    return new SIWESigner({
      signer: {
        signMessage: (message) => {
          console.log('[OKXWebWallet] Signing Ethereum message');
          return window.okxwallet.ethereum.request({
            method: 'personal_sign',
            params: [message, this.accounts[0]],
          });
        },
        getAddress: () => {
          console.log(
            `[OKXWebWallet] getAddress returning: ${this.accounts[0]}`,
          );
          return this.accounts[0];
        },
      },
      chainId: parseInt(this.getChainId()),
    });
  }

  // ACTIONS
  public async enable(forceChainId?: string) {
    console.log(
      `[OKXWebWallet] enable called with forceChainId: ${forceChainId}`,
    );
    this._enabling = true;
    try {
      if (!this.available) {
        this._enabling = false;
        console.error('[OKXWebWallet] Wallet not available');
        throw new Error('OKX wallet not installed or available!');
      }

      // Determine which chain to connect based on app context or parameters
      const chainType = app.chain?.base || this._chainType;
      console.log(`[OKXWebWallet] Using chain type: ${chainType}`);
      this._chainType = chainType;

      if (chainType === ChainBase.Solana) {
        await this.enableSolana();
      } else {
        await this.enableEthereum(forceChainId);
      }

      this._enabled = true;
      this._enabling = false;
      console.log('[OKXWebWallet] Successfully enabled');
    } catch (error) {
      this._enabling = false;
      console.error('[OKXWebWallet] Enable error:', error);
      throw new Error(`Failed to enable OKX wallet: ${error.message}`);
    }
  }

  private async enableSolana() {
    console.log('[OKXWebWallet] enableSolana called');
    try {
      const response = await window.okxwallet.solana.connect();
      console.log('[OKXWebWallet] Solana connected response:', response);

      const publicKey =
        typeof response.publicKey === 'function'
          ? (await response.publicKey()).toString()
          : response.publicKey.toString();

      console.log(`[OKXWebWallet] Got Solana public key: ${publicKey}`);
      this._accounts = [publicKey];

      // Setup event listeners
      window.okxwallet.solana.on('connect', () => {
        console.log('[OKXWebWallet] Solana connect event received');
      });

      window.okxwallet.solana.on('disconnect', () => {
        console.log('[OKXWebWallet] Solana disconnect event received');
        this._enabled = false;
        this._accounts = [];
      });

      window.okxwallet.solana.on('accountChanged', (publicKey) => {
        console.log(
          `[OKXWebWallet] Solana accountChanged event, new key: ${publicKey}`,
        );
        if (publicKey) {
          this._accounts = [publicKey.toString()];
        } else {
          // Try to reconnect
          window.okxwallet.solana.connect().catch(console.error);
        }
      });

      console.log('[OKXWebWallet] Solana setup complete');
    } catch (error) {
      console.error('[OKXWebWallet] enableSolana error:', error);
      throw new Error(`Solana connection failed: ${error.message}`);
    }
  }

  private async enableEthereum(forceChainId?: string) {
    console.log('[OKXWebWallet] enableEthereum called');
    try {
      // Request accounts
      console.log('[OKXWebWallet] Requesting Ethereum accounts');
      const accounts = await window.okxwallet.ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log(
        `[OKXWebWallet] Received Ethereum accounts: ${JSON.stringify(accounts)}`,
      );
      this._accounts = accounts;

      // Optionally switch to the correct chain
      if (forceChainId) {
        console.log(`[OKXWebWallet] Switching to chain: ${forceChainId}`);
        await this.switchNetwork(forceChainId);
      }

      // Setup event listeners
      window.okxwallet.ethereum.on('accountsChanged', (accounts) => {
        console.log(
          `[OKXWebWallet] Ethereum accountsChanged event: ${JSON.stringify(accounts)}`,
        );
        this._accounts = accounts;
      });

      window.okxwallet.ethereum.on('chainChanged', (chainId) => {
        console.log(`[OKXWebWallet] Ethereum chainChanged event: ${chainId}`);
        // Reload the page to ensure all state is updated correctly
        window.location.reload();
      });

      window.okxwallet.ethereum.on('disconnect', () => {
        console.log('[OKXWebWallet] Ethereum disconnect event received');
        this._enabled = false;
        this._accounts = [];
      });

      console.log('[OKXWebWallet] Ethereum setup complete');
    } catch (error) {
      console.error('[OKXWebWallet] enableEthereum error:', error);
      throw new Error(`Ethereum connection failed: ${error.message}`);
    }
  }

  public async switchNetwork(chainId?: string) {
    console.log(`[OKXWebWallet] switchNetwork called with chainId: ${chainId}`);

    if (this._chainType === ChainBase.Solana) {
      console.log('[OKXWebWallet] Solana does not support network switching');
      // Solana doesn't have network switching like EVM chains
      return;
    }

    try {
      const targetChainId = chainId || this.getChainId();
      const hexChainId = `0x${parseInt(targetChainId, 10).toString(16)}`;
      console.log(
        `[OKXWebWallet] Switching to Ethereum chain: ${targetChainId} (${hexChainId})`,
      );

      await window.okxwallet.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });

      console.log('[OKXWebWallet] Successfully switched chain');
    } catch (error) {
      console.error('[OKXWebWallet] switchNetwork error:', error);
      // This error code indicates that the chain has not been added to the wallet
      if (error.code === 4902) {
        // Could implement chain addition logic here if needed
        throw new Error(
          `Chain with ID ${chainId} not available in OKX wallet. Please add it first.`,
        );
      }
      throw error;
    }
  }

  public async reset() {
    console.log('[OKXWebWallet] reset called');
    if (
      this._chainType === ChainBase.Solana &&
      window.okxwallet?.solana?.disconnect
    ) {
      await window.okxwallet.solana.disconnect();
    }
    this._enabled = false;
    this._accounts = [];
    console.log('[OKXWebWallet] Reset complete');
  }
}

console.log('[OKXWebWallet] Module loaded');
export default OKXWebWalletController;
