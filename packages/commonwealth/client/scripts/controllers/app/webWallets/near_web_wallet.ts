/* eslint-disable @typescript-eslint/no-unused-vars */

import type { SessionPayload } from '@canvas-js/interfaces';
import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import Account from '../../../models/Account';
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

  public async getRecentBlock(chainIdentifier: string) {
    return null;
  }

  public async getSessionPublicAddress(): Promise<string> {
    return null;
  }

  public async signCanvasMessage(
    account: Account,
    canvasSessionPayload: SessionPayload,
  ): Promise<string> {
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
