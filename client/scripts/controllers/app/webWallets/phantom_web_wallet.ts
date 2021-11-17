import { ChainBase } from 'types';
import { Account, IWebWallet } from 'models';
import { setActiveAccount } from 'controllers/app/login';

class PhantomWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled = false;
  private _enabling = false;
  private _accounts: string[];

  public readonly name = 'phantom';
  public readonly label = 'Solana Wallet (Phantom)';
  public readonly chain = ChainBase.Solana;

  public get available() {
    // TODO
    return false;
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

  public async signMessage(message: string): Promise<string> {
    // TODO
    return '';
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    // TODO
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Phantom');
    this._enabled = true;
    this._enabling = false;
  }
}

export default PhantomWebWalletController;
