import { SigningCosmosClient } from '@cosmjs/launchpad';
import app from 'state';

declare let window: any;

class KeplrWebWalletController {
  // GETTERS/SETTERS
  private _offlineSigner: any;
  private _accounts: any[]; // Todo Typecasting...
  private _enabled: boolean;

  public get available() {
    if (!window.getOfflineSigner || !window.keplr) return false;
    if (!window.keplr?.experimentalSuggestChain) return alert('Please update to a more recent version of Keplr');
    return true;
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

    // get the chain id to enable
    if (!app.chain?.id || !app.chain?.meta?.chain?.id) return;
    const chainId = app.chain.meta.chain.id === 'straightedge' ? 'straightedge-2'
      : app.chain.meta.chain.id === 'cosmos' ? 'cosmoshub-3'
        : app.chain.meta.chain.id; // TODO: check injective
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
