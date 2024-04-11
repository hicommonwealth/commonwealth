declare let window: any;

import type { SessionSigner } from '@canvas-js/interfaces';

import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import { constructSolanaSignerCWClass } from 'shared/canvas/sessionSigners';
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
    return '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRecentBlock(chainIdentifier: string) {
    return null;
  }

  public async getSessionSigner(): Promise<SessionSigner> {
    const SolanaSignerCW = await constructSolanaSignerCWClass();
    return new SolanaSignerCW({
      signer: window.solana,
      chainId: this.getChainId(),
    });
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Phantom');
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
      throw new Error('Could not connect to Phantom wallet!');
    }
  }
}

export default PhantomWebWalletController;
