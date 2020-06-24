import { IApp } from 'state';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { IMolochMember } from 'adapters/chain/moloch/types';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumChain from 'controllers/chain/ethereum/chain';
import { IAccountsModule } from 'models';
import { AccountsStore } from 'stores';
import MolochMember from './member';
import MolochAPI from './api';

// TODO: ideally we should store DAO accounts inside the EthereumAccount object, rather
//   than extending it into a MolochMember. But this is our first-pass implementation,
//   for now.
export default class MolochMembers implements IAccountsModule<EthereumCoin, MolochMember> {
  protected _store: AccountsStore<MolochMember> = new AccountsStore();
  private _api: MolochAPI;
  private _Chain: EthereumChain;
  private _Accounts: EthereumAccounts;

  public get store() { return this._store; }
  public get api() { return this._api; }

  public async init(api: MolochAPI, ChainInfo: EthereumChain, Accounts: EthereumAccounts) {
    this._api = api;

    // only used to initialize member for super call
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
      return new MolochMember(this.app, this._Chain, this._Accounts, this, address);
    }
  }

  // returns a member immediately given a struct returned from chain
  public getFromJSON(member: IMolochMember): MolochMember {
    try {
      return this._store.getByAddress(member.id);
    } catch (e) {
      return new MolochMember(this.app, this._Chain, this._Accounts, this, member.id, member);
    }
  }

  public async isSenderMember(): Promise<boolean> {
    const sender = this._api.userAddress;
    const m = await this._api.Contract.members(sender);
    return m.exists && !m.shares.isZero();
  }

  public async isSenderDelegate(): Promise<boolean> {
    const sender = this._api.userAddress;
    const delegator = await this._api.Contract.memberAddressByDelegateKey(sender);
    if (parseInt(delegator, 16) === 0) {
      return false;
    }
    const m = await this._api.Contract.members(delegator);
    return m.exists && !m.shares.isZero();
  }
}
