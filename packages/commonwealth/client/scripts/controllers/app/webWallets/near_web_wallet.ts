import { SessionSigner } from '@canvas-js/interfaces';
import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import IWebWallet from '../../../models/IWebWallet';

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

  public getChainId() {
    return 'near';
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getRecentBlock(_chainIdentifier: string) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getSessionPublicAddress(): Promise<string> {
    return null;
  }

  public getSessionSigner(): SessionSigner {
    throw new Error('not implemented');
  }

  public async enable() {
    this._enabled = true;
  }

  public get enabled() {
    return this._enabled;
  }

  public async initConnection() {
    throw new Error('not implemented');
  }
}

export default NearWebWalletController;
