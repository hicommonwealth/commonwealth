declare let window: any;

import type { SessionPayload } from '@canvas-js/interfaces';
import bs58 from 'bs58';

import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import Account from '../../../models/Account';
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
    return 'mainnet';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRecentBlock(chainIdentifier: string) {
    return null;
  }

  public async signCanvasMessage(
    account: Account,
    canvasSessionPayload: SessionPayload,
  ): Promise<string> {
    const canvas = await import('@canvas-js/interfaces');
    const encodedMessage = new TextEncoder().encode(
      canvas.serializeSessionPayload(canvasSessionPayload),
    );
    const { signature } = await window.solana.signMessage(
      encodedMessage,
      'utf8',
    );
    return bs58.encode(signature as Uint8Array);
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
