import { Near as NearApi } from 'near-api-js';
import { ITXModalData, ProposalModule } from 'models';
import { NearAccounts } from 'controllers/chain/near/account';
import NearChain from 'controllers/chain/near/chain';
import NearSputnikProposal from './proposal';
import type { INearSputnikProposal } from './proposal';

// eslint-disable-next-line no-shadow
export enum NearSputnikProposalStatus {
  InProgress = 'InProgress',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Removed = 'Removed',
  Expired = 'Expired',
  Moved = 'Moved',
}

// eslint-disable-next-line no-shadow
export enum NearSputnikVoteString {
  Approve = 'Approve',
  Reject = 'Reject',
  Remove = 'Remove',
}

type VotePolicy = {
  weight_kind: string, // TODO
  quorum: string, // U128
  threshold: object, // TODO
};

type RolePermission = {
  name: string,
  kind: string,
  permissions: string[],
  vote_policy: { [kind: string]: VotePolicy },
};

export type NearSputnikPolicy = {
  roles: RolePermission[],
  default_vote_policy: VotePolicy,
  proposal_bond: string, // U128
  proposal_period: string, // nanoseconds
  bounty_bond: string, // U128
  bounty_forgiveness_period: string, // nanoseconds
};

// proposal type returned by get_proposals query
export type NearSputnikGetProposalResponse = {
  id: number,
  description: string,
  // see https://github.com/near-daos/sputnik-dao-contract/blob/master/sputnikdao2/src/proposals.rs#L48
  kind: { [kind: string]: any } | string,
  target?: string, // TODO: test
  proposer: string, // AccoundId
  status: NearSputnikProposalStatus,
  submission_time: string, // nanoseconds
  // who will be e.g. "council" in the case of a class of voters
  vote_counts: { [who: string]: [ number, number, number ] }, // yes / no / remove = spam
  votes: { [who: string]: NearSputnikVoteString, },
};

export default class NearSputnikDao extends ProposalModule<
  NearApi,
  INearSputnikProposal,
  NearSputnikProposal
> {
  private _Chain: NearChain;
  private _Accounts: NearAccounts;
  private _policy: NearSputnikPolicy;
  public get policy() { return this._policy; }

  // INIT / DEINIT
  public async init(chain: NearChain, accounts: NearAccounts) {
    this._Chain = chain;
    this._Accounts = accounts;
    this._policy = await this.query('get_policy', {});
    console.log(this._policy);
    const res: NearSputnikGetProposalResponse[] = await this.query('get_proposals', { from_index: 0, limit: 100 });
    res.forEach((p) => new NearSputnikProposal(
      this._Chain,
      this._Accounts,
      this,
      { ...p, identifier: `${p.id}` },
    ));
    // TODO: support bounties
    console.log(this);
    this._initialized = true;
  }

  public async query<T>(method: string, args: object): Promise<T> {
    const rawResult = await this._Chain.api.connection.provider.query({
      request_type: 'call_function',
      account_id: this._Chain.app.activeChainId(),
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    });
    const res = JSON.parse(Buffer.from((rawResult as any).result).toString());
    return res;
  }

  public deinit() {
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
