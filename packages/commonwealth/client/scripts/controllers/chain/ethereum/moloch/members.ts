import type { EthereumCoin } from 'adapters/chain/ethereum/types';
import type { IMolochMember } from 'adapters/chain/moloch/types';
import type EthereumAccounts from 'controllers/chain/ethereum/accounts';
import type EthereumChain from 'controllers/chain/ethereum/chain';
import type { IAccountsModule } from 'models';
import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import type MolochAPI from './api';
import MolochMember from './member';

// TODO: ideally we should store DAO accounts inside the EthereumAccount object, rather
//   than extending it into a MolochMember. But this is our first-pass implementation,
//   for now.
export default class MolochMembers
  implements IAccountsModule<EthereumCoin, MolochMember>
{
  protected _store: AccountsStore<MolochMember> = new AccountsStore();
  private _api: MolochAPI;
  private _Chain: EthereumChain;
  private _Accounts: EthereumAccounts;

  public get store() {
    return this._store;
  }

  public get api() {
    return this._api;
  }

  public async init(api: MolochAPI) {
    this._api = api;
  }

  public deinit() {
    this._store.clear();
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp, ChainInfo: EthereumChain, Accounts: EthereumAccounts) {
    this._app = app;

    // only used to initialize member for super call
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
  }

  public get(address: string) {
    try {
      return this._store.getByAddress(address);
    } catch (e) {
      if (!this._Accounts) return null;
      return new MolochMember(
        this.app,
        this._Chain,
        this._Accounts,
        this,
        address
      );
    }
  }

  // returns a member immediately given a struct returned from chain
  public getFromJSON(member: IMolochMember): MolochMember {
    try {
      return this._store.getByAddress(member.id);
    } catch (e) {
      if (!this._Accounts) return null;
      return new MolochMember(
        this.app,
        this._Chain,
        this._Accounts,
        this,
        member.id,
        member
      );
    }
  }

  public async isMember(address: string): Promise<boolean> {
    const m = await this._api.Contract.members(address);
    return m.exists && !m.shares.isZero();
  }

  public async isDelegate(address: string): Promise<boolean> {
    const delegator = await this._api.Contract.memberAddressByDelegateKey(
      address
    );
    if (parseInt(delegator, 16) === 0) {
      return false;
    }
    const m = await this._api.Contract.members(delegator);
    return m.exists && !m.shares.isZero();
  }
}
