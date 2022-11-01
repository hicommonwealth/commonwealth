import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, IWebWallet } from 'models';
import { CanvasData } from 'shared/adapters/shared';

// Stub wallet to satisfy the spec that does nothing -- the actual function of Ronin login
// is handled through redirects involving the `/finishAxieLogin` page.
class RoninWebWalletController implements IWebWallet<any> {
  public readonly name = WalletId.Ronin;
  public readonly label = 'Ronin Wallet';
  public readonly available = true;
  public readonly chain = ChainBase.Ethereum;
  public readonly enabling = false;
  public readonly specificChains = [ChainNetwork.AxieInfinity];
  public readonly defaultNetwork = ChainNetwork.AxieInfinity;

  private _enabled = false;

  public get accounts() {
    return [];
  }

  public async getChainId() {
    return null;
  }

  public async getSessionPublicAddress(): Promise<string> {
    return null;
  }

  public async signCanvasMessage(account: Account, canvasMessage: CanvasData): Promise<string> {
    throw new Error('not implemented');
  }

  public async getRecentBlock(chainIdentifier: string) {
    return null;
  }

  public async enable() {
    this._enabled = true;
  }

  public get enabled() {
    return this._enabled;
  }
}

export default RoninWebWalletController;
