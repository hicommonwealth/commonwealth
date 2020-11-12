import { IApp } from 'state';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { IMarlinHolder } from 'adapters/chain/marlin/types';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumChain from 'controllers/chain/ethereum/chain';
import { IAccountsModule } from 'models';
import { AccountsStore } from 'stores';
import MarlinHolder from './Holder';
import MarlinAPI from './api';
import MarlinChain from './chain';

export default class MarlinHolders implements IAccountsModule<EthereumCoin, MarlinHolder> {
  protected _store: AccountsStore<MarlinHolder> = new AccountsStore();
  private _api: MarlinAPI;
  private _Chain: MarlinChain;
  private _Accounts: EthereumAccounts;

  public get store() { return this._store; }
  public get api() { return this._api; }

  public async init(api: MarlinAPI) {
    this._api = api;

    // add activeAddress
    if (this.app.isLoggedIn() && this.app.user.activeAccount) {
      try {
        this._store.getByAddress(this.app.user.activeAccount.address);
      } catch {
        this._store.add(
          new MarlinHolder(this.app, this._Chain, this._Accounts, this, this.app.user.activeAccount.address)
        );
      }
    }
  }

  public deinit() {
    this._store.clear();
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp, ChainInfo: MarlinChain, Accounts: EthereumAccounts) {
    this._app = app;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
  }

  public get(address: string) {
    try {
      console.log('attempting to get:', address);
      return this._store.getByAddress(address);
    } catch (e) {
      console.log('MarlinHolders:', this._Accounts);
      return new MarlinHolder(this.app, this._Chain, this._Accounts, this, address);
    }
  }

  // returns a Holder immediately given a struct returned from chain
  public getFromJSON(holder: IMarlinHolder): MarlinHolder {
    try {
      return this._store.getByAddress(holder.id);
    } catch (e) {
      return new MarlinHolder(this.app, this._Chain, this._Accounts, this, holder.id);
    }
  }

  public async senderSetDelegate(address: string) {
    try {
      await this.api.compContract.delegate(address);
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  public async senderGetDelegate(): Promise<string> {
    const sender = this._api.userAddress;
    try {
      return this._api.compContract.delegates(sender);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public async isSenderHolder(): Promise<boolean> {
    const sender = this._api.userAddress;
    const m = await this._api.compContract.balances(sender);
    return !m.isZero();
  }

  public async isSenderDelegate(): Promise<boolean> {
    const sender = this._api.userAddress;
    const delegator = await this._api.compContract.delegates(sender);
    return delegator === sender;
  }
}
