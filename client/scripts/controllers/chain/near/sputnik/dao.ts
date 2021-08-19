import { Near as NearApi } from 'nearlib/lib/near';
import { ITXModalData, ProposalModule } from 'models';
import { NearAccounts } from 'controllers/chain/near/account';
import NearChain from 'controllers/chain/near/chain';
import NearSputnikProposal from './proposal';
import type { INearSputnikProposal } from './proposal';

export default class NearSputnikDao extends ProposalModule<
  NearApi,
  INearSputnikProposal,
  NearSputnikProposal
> {
  private _Chain: NearChain;
  private _Accounts: NearAccounts;

  // INIT / DEINIT
  public async init(chain: NearChain, accounts: NearAccounts) {
    this._Chain = chain;
    this._Accounts = accounts;
    // TODO: load proposals
    this._initialized = true;
  }

  public deinit() {
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
