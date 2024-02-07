/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
import { decodeAddress } from '@polkadot/util-crypto';
import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import Account from '../../../models/Account';
import { IAccountsModule } from '../../../models/interfaces';

export class SubstrateAccount extends Account {
  private _Accounts: SubstrateAccounts;

  public readonly isEd25519: boolean;

  // CONSTRUCTORS
  constructor(
    app: IApp,
    Accounts: SubstrateAccounts,
    address: string,
    isEd25519 = false
  ) {
    if (!app.isModuleReady) {
      // defer chain initialization
      super({ community: app.chain.meta, address });
    } else {
      super({ community: app.chain.meta, address });
    }
    this.isEd25519 = isEd25519;
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }
}

class SubstrateAccounts implements IAccountsModule<SubstrateAccount> {
  private _initialized = false;

  public get initialized() {
    return this._initialized;
  }

  // STORAGE
  private _store: AccountsStore<SubstrateAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  public get(address: string, keytype?: string) {
    if (keytype && keytype !== 'ed25519' && keytype !== 'sr25519') {
      throw new Error(`invalid keytype: ${keytype}`);
    }
    return this.fromAddress(address, keytype && keytype === 'ed25519');
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public isZero(address: string) {
    const decoded = decodeAddress(address);
    return decoded.every((v) => v === 0);
  }

  public fromAddress(address: string, isEd25519 = false): SubstrateAccount {
    try {
      decodeAddress(address); // try to decode address; this will produce an error if the address is invalid
    } catch (e) {
      console.error(`Decoded invalid address: ${address}`);
      return;
    }
    try {
      const acct = this._store.getByAddress(address);
      // update account key type if created with incorrect settings
      if (acct.isEd25519 !== isEd25519) {
        return new SubstrateAccount(this.app, this, address, isEd25519);
      } else {
        return acct;
      }
    } catch (e) {
      return new SubstrateAccount(this.app, this, address, isEd25519);
    }
  }

  // TODO: can we remove these functions?
  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public async init(): Promise<void> {
    this._initialized = true;
  }
}

export default SubstrateAccounts;
