import { IApp } from 'state';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
// import { IMarlinHolder } from 'adapters/chain/marlin/types';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumChain from 'controllers/chain/ethereum/chain';
import { IAccountsModule } from 'models';
import { AccountsStore } from 'stores';
import MarlinHolder from './Holder';
import MarlinAPI from './api';

// TODO: ideally we should store DAO accounts inside the EthereumAccount object, rather
//   than extending it into a MarlinHolder. But this is our first-pass implementation,
//   for now.
export default class MarlinHolders implements IAccountsModule<EthereumCoin, MarlinHolder> {
  protected _store: AccountsStore<MarlinHolder> = new AccountsStore();
  private _api: MarlinAPI;
  private _Chain: EthereumChain;
  private _Accounts: EthereumAccounts;

  public get store() { return this._store; }
  public get api() { return this._api; }

  public async init(api: MarlinAPI, ChainInfo: EthereumChain, Accounts: EthereumAccounts) {
    this._api = api;

    // only used to initialize Holder for super call
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
  }

  public deinit() {
    this._store.clear();
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public get(address: string) {
    try {
      return this._store.getByAddress(address.toLowerCase());
    } catch (e) {
      return new MarlinHolder(this.app, this._Chain, this._Accounts, this, address);
    }
  }

  // returns a Holder immediately given a struct returned from chain
  // public getFromJSON(holder: IMarlinHolder): MarlinHolder {
  //   try {
  //     return this._store.getByAddress(holder.id);
  //   } catch (e) {
  //     return new MarlinHolder(this.app, this._Chain, this._Accounts, this, holder.id, holder);
  //   }
  // }

  public async senderSetDelegate(address: string) {
    try {
      await this.api.compContract.delegate(address);
    } catch (e) {
      return console.error(e);
    }
  }

  public async isSenderHolder(): Promise<boolean> {
    const sender = this._api.userAddress;
    const m = await this._api.compContract.balances(sender);
    return !m.isZero();
  }

  // TODO: Check how contract returns delegates amount
  public async isSenderDelegate(): Promise<boolean> {
    const sender = this._api.userAddress;
    const delegator = await this._api.compContract.delegates(sender);
    return (parseInt(delegator, 16) !== 0);
  }
}
