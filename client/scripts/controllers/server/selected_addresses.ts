import { Account } from 'models';
import $ from 'jquery';
import app from 'state';

class SelectedAddressesController {
  private _chains;
  private _communities;

  public constructor() {
    this._chains = {};
    this._communities = {};
  }

  public reset(data?) {
    this._chains = data?.chains ? data.chains : {};
    this._communities = data?.communities ? data.communities : {};
  }

  public setByChain(chainId: string, account: Account<any>): void {
    this._chains[chainId] = account.address;
    this.save();
  }
  public getByChain(chainId: string): string {
    return this._chains[chainId];
  }

  public setByCommunity(communityId: string, account: Account<any>): void {
    this._communities[communityId] = account.address;
    this.save();
  }
  public getByCommunity(communityId: string): string {
     return this._communities[communityId];
  }

  public save() {
    return $.post(`${app.serverUrl()}/writeUserSetting`, {
      jwt: app.login.jwt,
      key: 'selectedAddresses',
      value: JSON.stringify({ chains: this._chains, communities: this._communities }),
    }).catch((e) => {
      throw new Error(e.responseJSON.error);
    });
  }
}

export default SelectedAddressesController;
