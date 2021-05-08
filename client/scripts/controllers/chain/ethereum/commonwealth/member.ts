import { IApp } from 'state';

import { ICommonwealthMember } from 'adapters/chain/commonwealth/types';

import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumChain from 'controllers/chain/ethereum/chain';

import CommonwealthMembers from './members';

export default class CommonwealthMember extends EthereumAccount {
  private _isMember: boolean;

  private _Members: CommonwealthMembers;

  public get isMember() { return this._isMember; }

  constructor(
    app: IApp,
    ChainInfo: EthereumChain,
    Accounts: EthereumAccounts,
    Members: CommonwealthMembers,
    address: string,
    data?: ICommonwealthMember
  ) {
    super(app, ChainInfo, Accounts, address);
    this._Members = Members;
    if (data) {
      if (address.toLowerCase() !== data.id.toLowerCase()) {
        throw new Error('member does not correspond with account');
      }
      this._isMember = true;
      this._initialized = Promise.resolve(true);
    } else {
      this._initialized = new Promise((resolve, reject) => {
        this.refresh().then(() => resolve(true));
      });
    }
    Members.store.add(this);
  }

  public async refresh() {
    // const m = await this._Members.api.Contract.members(this.address);
    // if (!m.exists) {
    //   this._isMember = false;
    // } else {
    //   this._isMember = true;
    // }
  }
}
