import { Account, ChainBase, IWebWallet } from 'models';

// TODO
class NearWebWalletController implements IWebWallet<any> {
  public readonly name = 'near';
  public readonly label = 'NEAR Wallet';
  public readonly available = true;
  public readonly chain = ChainBase.NEAR;
  public readonly enabling = false;

  private _enabled: boolean = false;

  public get accounts() {
    return [];
  }

  public async validateWithAccount(account: Account<any>, chain?: string): Promise<void> {
    throw new Error('not implemented');
  }

  public async enable() {
    this._enabled = true;
  }

  public get enabled() {
    return this._enabled;
  }
}

export default NearWebWalletController;
