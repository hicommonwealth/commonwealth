import type { IAccountsModule } from 'models';
import type { IApp } from 'state';
import { AccountsStore } from 'stores';

import type SolanaChain from './chain';
import type { SolanaToken } from './types';
import AddressAccount from "models/Address";

export default class SolanaAccounts
  implements IAccountsModule<SolanaToken, AddressAccount>
{
  private _initialized = false;
  public get initialized() {
    return this._initialized;
  }

  // STORAGE
  private _store: AccountsStore<AddressAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  private _Chain: SolanaChain;

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

  public fromAddress(address: string): AddressAccount {
    let acct;
    try {
      acct = this._store.getByAddress(address);
    } catch (e) {
      acct = new AddressAccount({
        address,
        chain: this.app.config.chains.getById(this.app.activeChainId())
      })
    }
    return acct;
  }

  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public async init(ChainInfo: SolanaChain): Promise<void> {
    this._Chain = ChainInfo;
    this._initialized = true;
  }
}
