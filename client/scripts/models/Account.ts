import $ from 'jquery';
import app, { IApp } from 'state';
import { Coin } from 'adapters/currency';
import { slugify } from 'utils';
import Token from 'controllers/chain/ethereum/token/adapter';

import { ITXModalData } from './interfaces';
import { ChainBase } from './types';
import ChainInfo from './ChainInfo';
import Profile from './Profile';

abstract class Account<C extends Coin> {
  public readonly serverUrl : string;
  public readonly address: string;
  public readonly chain: ChainInfo;
  public readonly chainBase: ChainBase;
  public get freeBalance() { return this.balance; }
  public abstract balance: Promise<C>;
  public abstract sendBalanceTx(recipient: Account<C>, amount: C): Promise<ITXModalData> | ITXModalData;
  public abstract signMessage(message: string): Promise<string>;
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
        isToken: this.chain.type === 'token',
        jwt: this.app.user.jwt,
        signature,
      };
      const result = await $.post(`${this.app.serverUrl()}/verifyAddress`, params);
      if (result.status === 'Success') {
        console.log(`Verified address ${this.address}!`);
      }
    } else {
      throw new Error('signature or key required for validation');
    }
  }
}

export default Account;
