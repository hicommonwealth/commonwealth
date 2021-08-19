import { Near as NearApi } from 'near-api-js';

import { IVote, Proposal, ProposalEndTime, VotingType, VotingUnit, ProposalStatus, ITXModalData } from 'models';
import { NearToken } from 'adapters/chain/near/types';
import { ICompletable } from 'adapters/shared';
import { NearAccount, NearAccounts } from 'controllers/chain/near/account';
import NearChain from 'controllers/chain/near/chain';
import NearSputnikDao from './dao';

export type INearSputnikProposal = ICompletable & {

};

// eslint-disable-next-line no-shadow
export enum NearVote {
  Approve,
  Reject,
  Remove,
}

export class NearSputnikVote implements IVote<NearToken> {
  public readonly account: NearAccount;
  public readonly choice: NearVote;

  constructor(member: NearAccount, choice: NearVote) {
    this.account = member;
    this.choice = choice;
  }
}

export default class NearSputnikProposal extends Proposal<
  NearApi,
  NearToken,
  INearSputnikProposal,
  NearSputnikVote
> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }
  public title: string;
  public get description() { return ''; }
  public get author() { return null; }

  public get votingType() {
    return VotingType.YesNoReject;
  }
  public get votingUnit() {
    return VotingUnit.OnePersonOneVote;
  }
  public canVoteFrom(account) {
    return true;
  }

  private _Chain: NearChain;
  private _Accounts: NearAccounts;
  private _Dao: NearSputnikDao;

  constructor(
    Chain: NearChain,
    Accounts: NearAccounts,
    Dao: NearSputnikDao,
    data: INearSputnikProposal
  ) {
    super('sputnikproposal', data);
    this._Chain = Chain;
    this._Accounts = Accounts;
    this._Dao = Dao;
    // TODO: init state
    this._Dao.store.add(this);
  }

  public update() {
    throw new Error('unimplemented');
  }
  get support() {
    return 0;
  }
  get turnout() {
    return 0;
  }
  get endTime(): ProposalEndTime {
    return { kind: 'unavailable' };
  }
  get isPassing(): ProposalStatus {
    return ProposalStatus.None;
  }
  public submitVoteTx(vote: NearSputnikVote): ITXModalData {
    throw new Error('unsupported');
  }
}
