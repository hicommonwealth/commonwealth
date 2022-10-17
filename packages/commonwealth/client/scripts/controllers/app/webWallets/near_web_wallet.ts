import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, IWebWallet } from 'models';

// Stub wallet to satisfy the spec that does nothing -- the actual function of NEAR login
// is handled through redirects involving the `/finishNearLogin` page.
class NearWebWalletController implements IWebWallet<any> {
  public readonly name = WalletId.NearWallet;
  public readonly label = 'NEAR Wallet';
  public readonly available = true;
  public readonly chain = ChainBase.NEAR;
  public readonly enabling = false;
  public readonly defaultNetwork = ChainNetwork.NEAR;

  private _enabled = false;

  public get accounts() {
    return [];
  }

  public async signWithAccount(account: Account): Promise<string> {
    throw new Error('not implemented');
  }

  public async validateWithAccount(
    account: Account,
    walletSignature: string
  ): Promise<void> {
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
