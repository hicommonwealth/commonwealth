declare let window: any;

import { SolanaSigner } from '@canvas-js/chain-solana';
import { AnchorProvider } from '@coral-xyz/anchor';
import {
  ChainBase,
  ChainNetwork,
  SOLANA_MAINNET_CHAIN_ID,
  WalletId,
} from '@hicommonwealth/shared';
import { Connection, PublicKey } from '@solana/web3.js';
import IWebWallet from '../../../models/IWebWallet';

class PhantomWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled = false;
  private _enabling = false;
  private _accounts: string[];

  public readonly name = WalletId.Phantom;
  public readonly label = 'Phantom';
  public readonly chain = ChainBase.Solana;
  public readonly defaultNetwork = ChainNetwork.Solana;

  public get available() {
    return window.solana && window.solana.isPhantom;
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
    // 5ey... is the solana mainnet genesis hash
    return SOLANA_MAINNET_CHAIN_ID;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRecentBlock(chainIdentifier: string) {
    return null;
  }

  public getSessionSigner() {
    return new SolanaSigner({
      signer: window.solana,
      chainId: this.getChainId(),
    });
  }

  /**
   * Returns an Anchor-compatible wallet for use with Anchor programs
   * @returns An object compatible with anchor.Wallet interface
   */
  public getAnchorWallet() {
    if (!this.enabled) {
      throw new Error('Phantom wallet not enabled! Call enable() first.');
    }

    if (!this.accounts || this.accounts.length === 0) {
      throw new Error('No accounts found in Phantom wallet!');
    }

    return {
      publicKey: new PublicKey(this.accounts[0]),
      signTransaction: async (tx: any) => {
        return await window.solana.signTransaction(tx);
      },
      signAllTransactions: async (txs: any[]) => {
        return await window.solana.signAllTransactions(txs);
      },
    };
  }

  /**
   * Creates an AnchorProvider using this wallet and the provided connection
   * @param connection Solana Connection to use
   * @param opts Optional provider options
   * @returns An AnchorProvider instance ready to use with Anchor programs
   */
  public createAnchorProvider(
    connection: Connection,
    opts: { commitment?: string; preflightCommitment?: string } = {},
  ) {
    try {
      // Get the anchor wallet interface
      const wallet = this.getAnchorWallet();

      // Create and return the provider
      return new AnchorProvider(connection, wallet, {
        commitment: opts.commitment || 'confirmed',
        preflightCommitment: opts.preflightCommitment || 'confirmed',
      });
    } catch (error) {
      throw error;
    }
  }

  // ACTIONS
  public async enable() {
    this._enabling = true;
    if (!this.available) {
      this._enabling = false;
      throw new Error('Phantom wallet not installed!');
    }
    try {
      const resp = await window.solana.connect();
      const key =
        typeof resp.publicKey === 'function'
          ? (await resp.publicKey()).toString()
          : resp.publicKey.toString();
      this._accounts = [key];
      this._enabling = false;
      this._enabled = true;
    } catch (err) {
      this._enabling = false;
      if (!window.solana.isConnected) {
        throw new Error(
          'No Phantom accounts found! Please setup your Phantom wallet and try again.',
        );
      }
      throw new Error('Could not connect to Phantom wallet!');
    }
  }
}

export default PhantomWebWalletController;
