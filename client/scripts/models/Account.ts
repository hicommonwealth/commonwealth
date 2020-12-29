import $ from 'jquery';
import { Observable } from 'rxjs';
import { IApp } from 'state';
import { Coin } from 'adapters/currency';

import { ITXModalData } from './interfaces';
import { ChainBase, ChainClass } from './types';
import ChainInfo from './ChainInfo';
import Profile from './Profile';


abstract class Account<C extends Coin> {
  public readonly serverUrl : string;
  public readonly address: string;
  public readonly chain: ChainInfo;

  public readonly chainBase: ChainBase;
  public readonly chainClass: ChainClass;
  public get freeBalance() { return this.balance; }
  public abstract balance: Observable<C>;
  public abstract sendBalanceTx(recipient: Account<C>, amount: C): Promise<ITXModalData> | ITXModalData;
  public async abstract signMessage(message: string): Promise<string>;
  protected abstract addressFromMnemonic(mnemonic: string): string;
  protected abstract addressFromSeed(seed: string): string;

  // The account's seed or mnemonic, used to generate their private key
  protected seed?: string;
  protected mnemonic?: string;
  // validation token sent by server
  private _validationToken?: string;
  private _addressId?: number;

  // A helper for encoding
  private _encoding: number;
  public get encoding() { return this._encoding; }

  private _profile: Profile;
  public get profile() { return this._profile; }

  public app: IApp;

  constructor(app: IApp, chain: ChainInfo, address: string, encoding?: number) {
    // Check if the account is being initialized from an offchain Community
    // Because there won't be any chain base or chain class
    this.app = app;
    this.chain = chain;
    this.chainBase = (app.chain) ? app.chain.base : null;
    this.chainClass = (app.chain) ? app.chain.class : null;
    this.address = address;
    this._profile = app.profiles.getProfile(chain.id, address);
    this._encoding = encoding;
  }

  public getSeed() {
    return this.seed;
  }
  public getMnemonic() {
    return this.mnemonic;
  }
  public setSeed(seed: string) {
    if (this.addressFromSeed(seed) !== this.address) {
      throw new Error('address does not match seed');
    }
    this.seed = seed;
  }
  public setMnemonic(mnemonic: string) {
    if (this.addressFromMnemonic(mnemonic) !== this.address) {
      throw new Error('address does not match mnemonic');
    }
    this.mnemonic = mnemonic;
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
  public async validate(signature?: string) {
    if (!this._validationToken) {
      throw new Error('no validation token found');
    }

    // We add a newline to the validation token because signing via the
    // command line always adds an implicit newline.
    if (!signature && (this.seed || this.mnemonic || this.chainBase === ChainBase.NEAR)) {
      // construct signature from private key
      signature = await this.signMessage(`${this._validationToken}\n`);
    } else if (!signature) {
      throw new Error('no signature or seed provided');
    }

    if (signature) {
      const params : any = {
        address: this.address,
        chain: this.chain.id,
        jwt: this.app.user.jwt,
        signature,
      };
      return new Promise((resolve, reject) => {
        $.post(`${this.app.serverUrl()}/verifyAddress`, params).then((result) => {
          if (result.status === 'Success') return resolve();
          else reject();
        }).catch((error) => {
          reject();
        });
      });
    } else {
      throw new Error('signature or key required for validation');
    }
  }
}

export default Account;
