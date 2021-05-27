import { IApp } from 'state';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { IAccountsModule } from 'models';
import { AccountsStore } from 'stores';
import AaveHolder from './holder';
import AaveAPI from './api';
import AaveChain from './chain';
import { attachSigner } from '../contractApi';

export default class AaveHolders implements IAccountsModule<EthereumCoin, AaveHolder> {
  protected _store: AccountsStore<AaveHolder> = new AccountsStore();
  private _api: AaveAPI;
  private _Chain: AaveChain;
  private _Accounts: EthereumAccounts;

  public get store() { return this._store; }
  public get api() { return this._api; }

  public async init(api: AaveAPI) {
    this._api = api;

    // add activeAddress
    if (this.app.isLoggedIn() && this.app.user.activeAccount) {
      try {
        this._store.getByAddress(this.app.user.activeAccount.address);
      } catch {
        this._store.add(
          new AaveHolder(this.app, this._Chain, this._Accounts, this, this.app.user.activeAccount.address)
        );
      }
    }
  }

  public deinit() {
    this._store.clear();
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp, ChainInfo: AaveChain, Accounts: EthereumAccounts) {
    this._app = app;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
  }

  public get(address: string) {
    try {
      console.log('attempting to get:', address);
      return this._store.getByAddress(address);
    } catch (e) {
      console.log('AaveHolders:', this._Accounts);
      return new AaveHolder(this.app, this._Chain, this._Accounts, this, address);
    }
  }
}
