import { Near as NearApi, Contract } from 'near-api-js';
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
  private _contract: Contract;

  // INIT / DEINIT
  public async init(chain: NearChain, accounts: NearAccounts) {
    this._Chain = chain;
    this._Accounts = accounts;

    // TODO: fetch without address?
    /*
    this._contract = new Contract('', this._Chain.app.activeChainId(), {
      viewMethods: [
        'get_config', 'get_policy', 'get_staking_contract', 'get_available_amount', 'delegation_total_supply',
        'get_proposals', 'get_last_proposal_id', 'get_proposal', 'get_bounty', 'get_bounties', 'get_last_bounty_id',
        'get_bounty_claims', 'get_bounty_number_of_claims', 'delegation_balance_of', 'has_blob'
      ],
      changeMethods: ['add_proposal', 'act_proposal'],
    });

    // TODO: paginate
    const proposals = this._contract.get_proposals({ from_index: 0, limit: 100 });
    */
    this._initialized = true;
  }

  public deinit() {
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
