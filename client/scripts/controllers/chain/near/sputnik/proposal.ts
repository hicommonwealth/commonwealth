import { Near as NearApi } from 'near-api-js';
import BN from 'bn.js';
import moment from 'moment';
import { Proposal, ProposalEndTime, VotingType, VotingUnit, ProposalStatus, ITXModalData } from 'models';
import { NearToken } from 'adapters/chain/near/types';
import { NearAccounts } from 'controllers/chain/near/account';
import NearChain from 'controllers/chain/near/chain';
import NearSputnikDao from './dao';
import {
  INearSputnikProposal,
  NearSputnikVote,
  NearSputnikProposalStatus,
  isAddMemberToRole,
  isRemoveMemberFromRole,
  isTransfer,
  isFunctionCall,
} from './types';

export default class NearSputnikProposal extends Proposal<
  NearApi,
  NearToken,
  INearSputnikProposal,
  NearSputnikVote
> {
  // TODO: fix
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }
  public get title() {
    const yoktoNear = new BN('1000000000000000000000000');
    // TODO: fetch decimals from https://github.com/AngelBlock/sputnik-dao-2-mockup/blob/dev/src/ProposalPage.jsx#L48
    const decimals = 18;
    // naming taken from https://github.com/AngelBlock/sputnik-dao-2-mockup/blob/dev/src/ProposalPage.jsx#L188
    if (this.data.kind === 'ChangeConfig') return 'Change Config: ';
    if (this.data.kind === 'ChangePolicy') return 'Change Policy: ';
    if (this.data.kind === 'UpgradeSelf') return `UpgradeSelf: ${this.data.target}`;
    if (this.data.kind === 'UpgradeRemote') return `UpgradeRemote: ${this.data.target}`;
    if (this.data.kind === 'Transfer') return `Transfer: ${this.data.target}`;
    if (this.data.kind === 'SetStakingContract') return `SetStakingContract: ${this.data.target}`;
    if (this.data.kind === 'AddBounty') return `AddBounty: ${this.data.target}`;
    if (this.data.kind === 'BountyDone') return `BountyDone: ${this.data.target}`;
    if (this.data.kind === 'Vote') return `Vote: ${this.data.target}`;
    if (isAddMemberToRole(this.data.kind) && this.data.kind.AddMemberToRole.role === 'council')
      return `Add ${this.data.kind.AddMemberToRole.member_id} to the council`;
    if (isRemoveMemberFromRole(this.data.kind) && this.data.kind.RemoveMemberFromRole.role === 'council')
      return `Remove ${this.data.kind.RemoveMemberFromRole.member_id} from the council`;
    if (isTransfer(this.data.kind) && this.data.kind.Transfer.token_id === '')
      return `${'Request for payout Ⓝ'}${
        (new BN(this.data.kind.Transfer.amount))
          .div(yoktoNear)
          .toNumber()
          .toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      } to ${this.data.kind.Transfer.receiver_id}`;
    if (decimals && isTransfer(this.data.kind) && this.data.kind.Transfer.token_id !== '')
      return `Request for payout ${
        this.data.kind.Transfer.token_id.split('.')[0].toUpperCase()
      }${
        (new BN(this.data.kind.Transfer.amount).div(new BN(10).pow(new BN(`${decimals}`))).toNumber().toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ','))
      } to ${
        this.data.kind.Transfer.receiver_id
      }`;
    if (isFunctionCall(this.data.kind) && this.data.kind.FunctionCall.actions[0].method_name === 'create_token')
      return 'Create token';
    return `Sputnik Proposal ${this.identifier}`;
  }
  public get description() { return this.data.description; }
  public get author() { return this._Accounts.get(this.data.proposer); }

  public get votingType() {
    return VotingType.YesNoReject;
  }

  // TODO: get from policy
  public get votingUnit() {
    return VotingUnit.OnePersonOneVote;
  }

  public canVoteFrom(account) {
    return true;
  }

  private _Chain: NearChain;
  private _Accounts: NearAccounts;
  private _Dao: NearSputnikDao;

  private _endTimeS: number;

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

    const periodS = +this._Dao.policy.proposal_period.slice(0, this._Dao.policy.proposal_period.length - 9);
    const submissionTimeS = +this.data.submission_time.slice(0, this.data.submission_time.length - 9);
    this._endTimeS = submissionTimeS + periodS;
    if (data.status !== NearSputnikProposalStatus.InProgress) {
      this.complete(this._Dao.store);
    } else if (this._endTimeS < +(Date.now())) {
      // special case for expiration that hasn't yet been triggered
      data.status = NearSputnikProposalStatus.Expired;
      this.complete(this._Dao.store);
    }
    // TODO: add weights to votes as needed
    for (const [voter, choice] of Object.entries(data.votes)) {
      this.addOrUpdateVote(new NearSputnikVote(this._Accounts.get(voter), choice));
    }
    this._Dao.store.add(this);
  }

  public update() {
    throw new Error('unimplemented');
  }

  get support() {
    // TODO: use policy to guide implementation
    return 0;
  }

  // TODO: this will either require fetching all members of the voting role,
  // or doing a coin weight vs total delegated amount
  get turnout() {
    return 0;
  }

  get endTime(): ProposalEndTime {
    return { kind: 'fixed', time: moment.unix(this._endTimeS) };
  }

  get isPassing(): ProposalStatus {
    if (this.data.status === NearSputnikProposalStatus.InProgress) {
      // TODO: base on policy threshold
      return ProposalStatus.Passing;
    } else if (this.data.status === NearSputnikProposalStatus.Approved) {
      return ProposalStatus.Passed;
    } else {
      return ProposalStatus.Failed;
    }
  }

  public submitVoteTx(vote: NearSputnikVote): ITXModalData {
    throw new Error('unsupported');
  }
}
