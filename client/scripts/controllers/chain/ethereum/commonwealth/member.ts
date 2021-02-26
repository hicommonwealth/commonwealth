import { IApp } from 'state';

import { ICommonwealthMember } from 'adapters/chain/commonwealth/types';

import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumChain from 'controllers/chain/ethereum/chain';

import CommonwealthMembers from './members';

export default class CommonwealthMember extends EthereumAccount {
  private _Members: CommonwealthMembers;

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
      // TODO: set data
    }
    Members.store.add(this);
  }

  public async refresh() {
    // const m = await this._Members.api.Contract.members(this.address);
    // TODO: update data
  }
}
