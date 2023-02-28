/* eslint-disable @typescript-eslint/no-unused-vars */

import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import type { Account, IWebWallet } from 'models';
import type { SessionPayload } from '@canvas-js/interfaces';

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
    canvasMessage: SessionPayload
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
