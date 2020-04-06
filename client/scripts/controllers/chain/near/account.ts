import { Account, IAccountsModule, ITXModalData } from 'models/models';
import { NearToken } from 'adapters/chain/near/types';
import { IApp } from 'state';
import { Observable, from, Unsubscribable } from 'rxjs';
import { AccountsStore } from 'models/stores';
import * as nearlib from 'nearlib';
import { map, shareReplay } from 'rxjs/operators';
import { AccountState } from 'nearlib/lib/account';
import nacl from 'tweetnacl';
import { BrowserLocalStorageKeyStore } from 'nearlib/lib/key_stores';
import { NodeStatusResult } from 'nearlib/lib/providers/provider';
import NearChain from './chain';

// NOTE: this is the actual type of validators in the NodeStatus struct,
//    the library is wrong, it's not just a string.
interface INearValidator {
  account_id: string;
  is_slashed: boolean;
}

export interface INearValidators {
  [accountId: string]: {
    account: NearAccount;
    isSlashed: boolean;
  };
}

export class NearAccounts implements IAccountsModule<NearToken, NearAccount> {
  private _Chain: NearChain;
  private _store: AccountsStore<NearAccount> = new AccountsStore();
  public get store() { return this._store; }
  public readonly keyStore: BrowserLocalStorageKeyStore;

  private _validatorSubscription: Unsubscribable;
  private _validators: INearValidators = {};
  public get validators() { return this._validators; }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
    this.keyStore = new BrowserLocalStorageKeyStore(localStorage);
  }

  public get(address: string): NearAccount {
    if (!this._Chain) return null; // We can't construct accounts if the NEAR chain isn't loaded
    return this.fromAddress(address);
  }

  public fromAddress(address: string): NearAccount {
    let acct;
    try {
      acct = this._store.getByAddress(address);
    } catch (e) {
      acct = new NearAccount(this.app, this._Chain, this, address);
    }
    return acct;
  }

  public async init(ChainInfo: NearChain): Promise<void> {
    this._Chain = ChainInfo;
    this._validatorSubscription = ChainInfo.nodeStatus$.subscribe((nodeStatus: NodeStatusResult) => {
      const validators = nodeStatus.validators as unknown as INearValidator[];
      for (const validator of validators) {
        if (!this._validators[validator.account_id]) {
          this._validators[validator.account_id] = {
            account: this.get(validator.account_id),
            isSlashed: validator.is_slashed,
          };
        }
      }
    });
  }
  public async deinit() {
    if (this._validatorSubscription) {
      this._validatorSubscription.unsubscribe();
    }
    for (const v of Object.keys(this._validators)) {
      delete this._validators[v];
    }
    this.store.clear();
  }
}

export class NearAccount extends Account<NearToken> {
  private _nearlibAccount: nearlib.Account;
  private _keyPair: nearlib.KeyPair;
  private _Accounts: NearAccounts;
  private _Chain: NearChain;
  constructor(app: IApp, Chain: NearChain, Accounts: NearAccounts, address: string) {
    super(app, app.chain.meta.chain, address);
    this._nearlibAccount = new nearlib.Account(Chain.api.connection, address);
    this._Chain = Chain;
    this._Accounts = Accounts;
    this.updateKeypair(); // async action -- should be quick tho
    this._Accounts.store.add(this);
  }

  public get balance(): Observable<NearToken> {
    return from(this._nearlibAccount.state()).pipe(
      map((s: AccountState) => {
        return this._Chain.coins(s.amount, false);
      }),
      shareReplay(1),
    );
  }

  public sendBalanceTx(recipient: NearAccount, amount: NearToken): ITXModalData {
    throw new Error('tx not supported on NEAR protocol');
  }

  public hasKeypair(): boolean {
    return !!this._keyPair;
  }

  // This must be called successfully before we can sign a message or
  // use the account in any way that requires a key.
  public async updateKeypair(): Promise<boolean> {
    return new Promise(async (resolve) => {
      this._keyPair = await this._Accounts.keyStore.getKey(this._Chain.api.connection.networkId, this.address);
      // if a keypair is found, return
      if (!!this._keyPair) {
        return resolve(!!this._keyPair);
      }
      // otherwise, call updateKeypair again with a delay
      setTimeout(async () => {
        resolve(await this.updateKeypair());
      }, 1000);
    });
  }

  public async signMessage(message: string): Promise<string> {
    if (!this._keyPair) {
      throw new Error('no keypair found!');
    }
    const { signature, publicKey } = this._keyPair.sign(Buffer.from(message));
    return JSON.stringify({
      signature: Buffer.from(signature).toString('base64'),
      publicKey: Buffer.from(publicKey.data).toString('base64')
    });
  }

  // signature must be a JSON object of type "Signature" (cf. CosmosAccount)
  public async isValidSignature(message: string, signature: string): Promise<boolean> {
    try {
      const { signature: sigObj, publicKey } = JSON.parse(signature);
      const isValid = nacl.sign.detached.verify(
        Buffer.from(message),
        Buffer.from(sigObj, 'base64'),
        Buffer.from(publicKey, 'base64'));
      return isValid;
    } catch (e) {
      console.error('Signature validation error: ', e);
      return false;
    }
  }

  protected addressFromMnemonic(mnemonic: string): string {
    throw new Error('not valid on Near protocol');
  }

  protected addressFromSeed(seed: string): string {
    throw new Error('not valid on Near protocol');
  }
}
