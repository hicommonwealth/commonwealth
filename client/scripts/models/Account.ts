import $ from 'jquery';
import app, { IApp } from 'state';
import { Coin } from 'adapters/currency';
import { ChainBase, ChainType } from 'types';

import ChainInfo from './ChainInfo';
import Profile from './Profile';

abstract class Account<C extends Coin> {
  public readonly serverUrl : string;
  public readonly address: string;
  public readonly chain: ChainInfo;
  public readonly chainBase: ChainBase;
  public readonly ghost_address: ChainBase;
  public get freeBalance() { return this.balance; }
  public abstract balance: Promise<C>;

  // validation token sent by server
  private _validationToken?: string;
  private _addressId?: number;

  // A helper for encoding
  private _encoding: number;
  public get encoding() { return this._encoding; }

  private _profile: Profile;
  public get profile() { return this._profile; }

  public app: IApp;

  constructor(_app: IApp, chain: ChainInfo, address: string, encoding?: number) {
    // Check if the account is being initialized from an offchain Community
    // Because there won't be any chain base or chain class
    this.app = _app;
    this.chain = chain;
    this.chainBase = (_app.chain) ? _app.chain.base : null;
    this.address = address;
    this._profile = _app.profiles.getProfile(chain.id, address);
    this._encoding = encoding;
  }

  public setEncoding(encoding: number) {
    this._encoding = encoding;
  }

  get addressId() {
    return this._addressId;
  }
  public setAddressId(id: number) {
    this._addressId = id;
  }

  get validationToken() {
    return this._validationToken;
  }
  public setValidationToken(token: string) {
    this._validationToken = token;
  }
  public async validate(signature: string) {
    if (!this._validationToken) {
      throw new Error('no validation token found');
    }
    if (!signature) {
      throw new Error('signature required for validation');
    }

    const params : any = {
      address: this.address,
      chain: this.chain.id,
      isToken: this.chain.type === ChainType.Token,
      jwt: this.app.user.jwt,
      signature,
    };
    const result = await $.post(`${this.app.serverUrl()}/verifyAddress`, params);
    if (result.status === 'Success') {
      // update ghost address for discourse users
      const hasGhostAddress = app.user.addresses.some(({ address, ghostAddress, chain }) => (
          ghostAddress && this.chain.id === chain &&
          app.user.activeAccounts.some((account) => account.address === address)
      ))
      if (hasGhostAddress) {
        const { success, ghostAddressId } = await $.post(`${this.app.serverUrl()}/updateAddress`, params);
        if (success && ghostAddressId) {
          // remove ghost address from addresses
          app.user.setAddresses(app.user.addresses.filter(({ ghostAddress }) => {
            return !ghostAddress
          }));
          app.user.setActiveAccounts([]);
        }
      }
    }
  }
}

export default Account;
