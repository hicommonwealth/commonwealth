import BN from 'bn.js';
import type { NearAccounts } from 'controllers/chain/near/account';
import type NearChain from 'controllers/chain/near/chain';
import type { ITXModalData } from '../../../../models/interfaces';
import ProposalModule from '../../../../models/ProposalModule';
import type { Near as NearApi } from 'near-api-js';
import { Account as NearApiAccount } from 'near-api-js';
import NearSputnikProposal from './proposal';
import type {
  INearSputnikProposal,
  NearSputnikGetProposalResponse,
  NearSputnikPolicy,
  NearSputnikProposalKind,
} from './types';

export default class NearSputnikDao extends ProposalModule<
  NearApi,
  INearSputnikProposal,
  NearSputnikProposal
> {
  private _Chain: NearChain;
  private _Accounts: NearAccounts;
  private _policy: NearSputnikPolicy;
  public get policy() {
    return this._policy;
  }

  private _tokenSupply: BN;
  public get tokenSupply() {
    return this._tokenSupply;
  }

  private _nProposals: number;

  // INIT / DEINIT
  public async init(chain: NearChain, accounts: NearAccounts) {
    this._Chain = chain;
    this._Accounts = accounts;
    this._policy = await this._Chain.query(
      this.app.activeChainId(),
      'get_policy',
      {}
    );
    const state = await new NearApiAccount(
      this._Chain.api.connection,
      this.app.activeChainId()
    ).state();
    this._tokenSupply = new BN(state.amount);
    const res: NearSputnikGetProposalResponse[] = await this._Chain.query(
      this.app.activeChainId(),
      'get_proposals',
      { from_index: 0, limit: 100 }
    );
    res.forEach(
      (p) =>
        new NearSputnikProposal(this._Chain, this._Accounts, this, {
          ...p,
          identifier: `${p.id}`,
        })
    );
    this._nProposals = +(await this._Chain.query(
      this.app.activeChainId(),
      'get_last_proposal_id',
      {}
    ));
    // TODO: support bounties
    this._initialized = true;
  }

  public deinit() {
    this.store.clear();
  }

  public async proposeTx(description: string, kind: NearSputnikProposalKind) {
    // TODO: user pre-checks

    const contractId = this.app.activeChainId();
    const methodName = 'add_proposal';
    const args = {
      proposal: {
        description: description.trim(),
        kind,
      },
    };

    const nextProposalId = this._nProposals;
    const callbackUrl = `${window.location.origin}/${contractId}/proposal/${nextProposalId}`;
    await this._Chain.redirectTx(
      contractId,
      methodName,
      args,
      this.policy.proposal_bond,
      callbackUrl
    );
  }

  public createTx(): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
