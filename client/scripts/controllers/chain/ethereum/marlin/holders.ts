import { IApp } from 'state';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { IAccountsModule } from 'models';
import { AccountsStore } from 'stores';
import MarlinHolder from './holder';
import MarlinAPI from './api';
import MarlinChain from './chain';
import { attachSigner } from '../contractApi';

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

  public async senderSetDelegate(address: string, amount: number) {
    try {
      const contract = await attachSigner(this.app.wallets, this.app.user.activeAccount.address, this.api.Contract);
      await contract.delegate(address, amount);
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  public async senderGetDelegate(): Promise<string> {
    // TODO: I don't think this is implementable anymore because of how the MPOND delegates mapping works now
    return new Promise(() => 'Method Not Implemented');
    // const sender = this._api.userAddress;
    // const bridge = this._api.bridge;
    // try {
    //   const delegate = await this._api.mPondContract.delegates(bridge, sender);
    //   const zeroAddress = '0x0000000000000000000000000000000000000000';
    //   return delegate === zeroAddress ? null : delegate;
    // } catch (err) {
    //   console.error(err);
    //   return null;
    // }
  }

  public async isHolder(address: string): Promise<boolean> {
    const m = await this._api.Contract.balances(address);
    return !m.isZero();
  }

  public async isDelegate(address: string): Promise<boolean> {
    const delegator = await this._api.Contract.getCurrentVotes(address);
    return !delegator.isZero();
  }
}
