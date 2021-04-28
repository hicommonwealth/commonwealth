import { ChainBase } from 'client/scripts/models';
import IWebWallet from 'models/IWebWallet';

// TODO
class NearWebWalletController implements IWebWallet {
  public readonly label = 'NEAR Wallet';
  public readonly available = true;
  public readonly chain = ChainBase.NEAR;

  private _enabled: boolean = false;

  public get accounts() {
    return [];
  }

  public async enable() {
    this._enabled = true;
  }

  public get enabled() {
    return this._enabled;
  }
}

export default NearWebWalletController;
