import { ChainBase, ChainNetwork } from 'types';
import { Account, IWebWallet } from 'models';

// Stub wallet to satisfy the spec that does nothing -- the actual function of Ronin login
// is handled through redirects involving the `/finishAxieLogin` page.
class RoninWebWalletController implements IWebWallet<any> {
  public readonly name = 'ronin';
  public readonly label = 'Ronin Wallet';
  public readonly available = true;
  public readonly chain = ChainBase.Ethereum;
  public readonly enabling = false;
  public readonly specificChain = ChainNetwork.AxieInfinity;

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
}

export default RoninWebWalletController;
