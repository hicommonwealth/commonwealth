import app from 'state';

import { ChainBase } from 'client/scripts/models';
import IWebWallet from 'models/IWebWallet';

declare let window: any;

class KeplrWebWalletController implements IWebWallet {
  // GETTERS/SETTERS
  private _offlineSigner: any;
  private _accounts: any[]; // Todo Typecasting...
  private _enabled: boolean;

  public readonly label = 'Cosmos Wallet (keplr)';
  public readonly chain = ChainBase.CosmosSDK;

  public get available() {
    return window.getOfflineSigner && window.keplr;
  }
  public get enabled() {
    return this.available && this._enabled;
  }
  public get accounts() {
    return this._accounts || [];
  }
  public get offlineSigner() {
    return this._offlineSigner;
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Keplr web wallet');

    if (!window.keplr?.experimentalSuggestChain) {
      alert('Please update to a more recent version of Keplr');
      return;
    }

    // get the chain id to enable
    if (!app.chain?.id || !app.chain?.meta?.chain?.id) return;
    const chainId = app.chain.meta.chain.id === 'straightedge' ? 'straightedge-2'
      : app.chain.meta.chain.id === 'cosmos' ? 'cosmoshub-3'
        : null;
    if (!chainId) return;

    // enable
    await window.keplr.enable(chainId);
    console.log(`Enabled web wallet for ${chainId}`);
    this._offlineSigner = window.getOfflineSigner(chainId);
    this._accounts = await this._offlineSigner.getAccounts();
    this._enabled = true;
  }
}

export default KeplrWebWalletController;
