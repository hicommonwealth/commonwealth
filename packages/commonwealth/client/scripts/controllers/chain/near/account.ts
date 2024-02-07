/* eslint-disable no-use-before-define */
import type { NearToken } from 'adapters/chain/near/types';
import { Account as NearJsAccount, keyStores } from 'near-api-js';
import type { AccountView } from 'near-api-js/lib/providers/provider';
import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import Account from '../../../models/Account';
import { IAccountsModule } from '../../../models/interfaces';
import type NearChain from './chain';

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

export class NearAccount extends Account {
  private _walletConnection: NearJsAccount;
  public get walletConnection() {
    return this._walletConnection;
  }

  private _Accounts: NearAccounts;
  private _Chain: NearChain;

  constructor(
    app: IApp,
    Chain: NearChain,
    Accounts: NearAccounts,
    address: string
  ) {
    super({ community: app.chain.meta, address });
    this._walletConnection = new NearJsAccount(Chain.api.connection, address);
    this._Chain = Chain;
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  public get balance(): Promise<NearToken> {
    return this._walletConnection.state().then((s: AccountView) => {
      return this._Chain.coins(s.amount, false);
    });
  }

  public async signMessage(message: string): Promise<string> {
    if (!this._walletConnection.connection?.signer) {
      throw new Error('no signer found!');
    }
    const kp = await this._Accounts.keyStore.getKey(
      this._Chain.isMainnet ? 'mainnet' : 'testnet',
      this.address
    );
    const { publicKey, signature } = kp.sign(Buffer.from(message));
    return JSON.stringify({
      signature: Buffer.from(signature).toString('base64'),
      publicKey: Buffer.from(publicKey.data).toString('base64'),
    });
  }
}

export class NearAccounts implements IAccountsModule<NearAccount> {
  private _Chain: NearChain;
  private _store: AccountsStore<NearAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  public readonly keyStore: keyStores.BrowserLocalStorageKeyStore;

  private _validators: INearValidators = {};
  public get validators() {
    return this._validators;
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
    this.keyStore = new keyStores.BrowserLocalStorageKeyStore(localStorage);
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
    const validators = ChainInfo.nodeStatus
      .validators as unknown as INearValidator[];
    for (const validator of validators) {
      if (!this._validators[validator.account_id]) {
        this._validators[validator.account_id] = {
          account: this.get(validator.account_id),
          isSlashed: validator.is_slashed,
        };
      }
    }
  }

  public async deinit() {
    for (const v of Object.keys(this._validators)) {
      delete this._validators[v];
    }
    this.store.clear();
  }
}
