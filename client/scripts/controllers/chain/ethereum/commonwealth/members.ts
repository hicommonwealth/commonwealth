import { IApp } from 'state';

import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { ICommonwealthMember } from 'adapters/chain/commonwealth/types';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumChain from 'controllers/chain/ethereum/chain';
import { IAccountsModule } from 'models';
import { AccountsStore } from 'stores';

import CommonwealthMember from './member';
import CommonwealthAPI from './api';


export default class CommonwealthMembers implements IAccountsModule<EthereumCoin, CommonwealthMember> {
  protected _store: AccountsStore<CommonwealthMember> = new AccountsStore();
  private _api: CommonwealthAPI;
  private _Chain: EthereumChain;
  private _Accounts: EthereumAccounts;

  public get store() { return this._store; }
  public get api() { return this._api; }

  public async init(api: CommonwealthAPI) {
    this._api = api;
  }

  public deinit() {
    this._store.clear();
  }

  private _app: IApp;
  public get app() { return this._app };

  constructor(
    app: IApp,
    ChainInfo: EthereumChain,
    Accounts: EthereumAccounts
  ) {
    this._app = app;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
  }

  public get(address: string) {
    try {
      return this._store.getByAddress(address.toLocaleLowerCase());
    } catch(e) {
      if (!this._Accounts) return null;
      return new CommonwealthMember(this.app, this._Chain, this._Accounts, this, address);
    }
  }

  public getFromJSON(member: ICommonwealthMember): CommonwealthMember {
    try {
      return this._store.getByAddress(member.id);
    } catch(e) {
      if (!this._Accounts) return null;
      return new CommonwealthMember(this.app, this._Chain, this._Accounts, this, member.id, member);
    }
  }
}
