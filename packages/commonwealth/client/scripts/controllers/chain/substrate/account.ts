/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
import { decodeAddress } from '@polkadot/util-crypto';
import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import Account from '../../../models/Account';
import { IAccountsModule } from '../../../models/interfaces';

export class SubstrateAccount extends Account {
  private _Accounts: SubstrateAccounts;

  // CONSTRUCTORS
  constructor(app: IApp, Accounts: SubstrateAccounts, address: string) {
    if (!app.isModuleReady) {
      // defer chain initialization
      super({
        community: {
          id: app.chain.meta.id || '',
          base: app.chain.meta.base,
          ss58Prefix: app.chain.meta.ss58_prefix || 0,
        },
        address,
      });
    } else {
      super({
        community: {
          id: app.chain.meta.id || '',
          base: app.chain.meta.base,
          ss58Prefix: app.chain.meta.ss58_prefix || 0,
        },
        address,
      });
    }
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

  public get(address: string) {
    return this.fromAddress(address);
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

  public fromAddress(address: string): SubstrateAccount {
    try {
      decodeAddress(address); // try to decode address; this will produce an error if the address is invalid
    } catch (e) {
      console.error(`Decoded invalid address: ${address}`);
      // @ts-expect-error StrictNullChecks
      return;
    }
    try {
      const acct = this._store.getByAddress(address);
      return acct;
    } catch (e) {
      return new SubstrateAccount(this.app, this, address);
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
