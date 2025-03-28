// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any;

import { SolanaSigner } from '@canvas-js/chain-solana';
import {
  ChainBase,
  ChainNetwork,
  SOLANA_MAINNET_CHAIN_ID,
  WalletId,
} from '@hicommonwealth/shared';
import IWebWallet from '../../../models/IWebWallet';

class BackpackWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled = false;
  private _enabling = false;
  private _accounts: string[];

  public readonly name = WalletId.Backpack;
  public readonly label = 'Backpack';
  public readonly chain = ChainBase.Solana;
  public readonly defaultNetwork = ChainNetwork.Solana;

  public get available() {
    return window.backpack && window.backpack.solana;
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  public async getRecentBlock(chainIdentifier: string) {
    return null;
  }

  public getSessionSigner() {
    return new SolanaSigner({
      signer: window.backpack.solana,
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
      const resp = await window.backpack.solana.connect();
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

export default BackpackWebWalletController;
