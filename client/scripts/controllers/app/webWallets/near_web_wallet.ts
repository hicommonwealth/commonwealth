import { ChainBase, WalletId } from 'types';
import { Account, IWebWallet } from 'models';

// Stub wallet to satisfy the spec that does nothing -- the actual function of NEAR login
// is handled through redirects involving the `/finishNearLogin` page.
class NearWebWalletController implements IWebWallet<any> {
  public readonly name = WalletId.NearWallet;
  public readonly label = 'NEAR Wallet';
  public readonly available = true;
  public readonly chain = ChainBase.NEAR;
  public readonly enabling = false;

  private _enabled = false;

  public get accounts() {
    return [];
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    throw new Error('not implemented');
  }

  public async enable() {
    this._enabled = true;
  }

  public get enabled() {
    return this._enabled;
  }

  public async signMessage(message: string): Promise<string> {
    throw new Error('Unimplemented');
  }
}

export default NearWebWalletController;
