import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import type { IAccountsModule } from '../../../models/interfaces';

import SuiAccount from './account';
import type SuiChain from './chain';

export default class SuiAccounts implements IAccountsModule<SuiAccount> {
  private _initialized = false;
  public get initialized() {
    return this._initialized;
  }

  // STORAGE
  private _store: AccountsStore<SuiAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  private _Chain: SuiChain;

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

  public fromAddress(address: string): SuiAccount {
    let acct;
    try {
      acct = this._store.getByAddress(address);
    } catch (e) {
      acct = new SuiAccount(this.app, this._Chain, this, address);
    }
    return acct;
  }

  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public async init(ChainInfo: SuiChain): Promise<void> {
    this._Chain = ChainInfo;
    this._initialized = true;
  }
}
