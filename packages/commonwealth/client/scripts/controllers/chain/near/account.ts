/* eslint-disable no-use-before-define */
import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import Account from '../../../models/Account';
import { IAccountsModule } from '../../../models/interfaces';
import type NearChain from './chain';

export class NearAccount extends Account {
  private _Accounts: NearAccounts;
  private _Chain: NearChain;

  constructor(
    app: IApp,
    Chain: NearChain,
    Accounts: NearAccounts,
    address: string,
  ) {
    super({
      community: {
        id: app.chain.meta.id || '',
        base: app.chain.meta.base,
        ss58Prefix: app.chain.meta.ss58_prefix || 0,
      },
      address,
    });
    this._Chain = Chain;
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  public get balance(): Promise<unknown> {
    throw new Error('not implemented');
  }
}

export class NearAccounts implements IAccountsModule<NearAccount> {
  private _Chain: NearChain;
  private _store: AccountsStore<NearAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public get(address: string): NearAccount {
    // @ts-expect-error StrictNullChecks
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
  }

  public async deinit() {
    this.store.clear();
  }
}
