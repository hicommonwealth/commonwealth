/* eslint-disable @typescript-eslint/no-unused-vars */

import { ProposalType } from '@hicommonwealth/core';
import type { NearToken } from 'adapters/chain/near/types';
import BN from 'bn.js';
import type { NearAccount, NearAccounts } from 'controllers/chain/near/account';
import type NearChain from 'controllers/chain/near/chain';
import moment from 'moment';
import type { Near as NearApi } from 'near-api-js';
import Proposal from '../../../../models/Proposal';
import type { ITXModalData } from '../../../../models/interfaces';
import type { ProposalEndTime } from '../../../../models/types';
import {
  ProposalStatus,
  VotingType,
  VotingUnit,
} from '../../../../models/types';
import type NearSputnikDao from './dao';
import type { INearSputnikProposal, VotePolicy } from './types';
import {
  NearSputnikProposalStatus,
  NearSputnikVote,
  WeightKind,
  getTotalSupply,
  getUserRoles,
  getVotePolicy,
  isAddMemberToRole,
  isChangeConfig,
  isChangePolicy,
  isFunctionCall,
  isRemoveMemberFromRole,
  isTransfer,
  isWeight,
} from './types';

export default class NearSputnikProposal extends Proposal<
  NearApi,
  NearToken,
  INearSputnikProposal,
  NearSputnikVote
> {
  // TODO: get the correct short id
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }

  public get title() {
    // naming taken from https://github.com/AngelBlock/sputnik-dao-2-mockup/blob/dev/src/ProposalPage.jsx#L188
    if (isChangeConfig(this.data.kind))
      return `Change Config: ${this.data.description}`;
    if (isChangePolicy(this.data.kind))
      return `Change Policy: ${this.data.description}`;
    if (this.data.kind === 'UpgradeSelf')
      return `UpgradeSelf: ${this.data.description}`;
    if (this.data.kind === 'UpgradeRemote')
      return `UpgradeRemote: ${this.data.description}`;
    if (this.data.kind === 'SetStakingContract')
      return `SetStakingContract: ${this.data.description}`;
    if (this.data.kind === 'AddBounty')
      return `AddBounty: ${this.data.description}`;
    if (this.data.kind === 'BountyDone')
      return `BountyDone: ${this.data.description}`;
    if (this.data.kind === 'Vote') return `Vote: ${this.data.description}`;
    if (
      isAddMemberToRole(this.data.kind) &&
      this.data.kind.AddMemberToRole.role === 'council'
    )
      return `Add ${this.data.kind.AddMemberToRole.member_id} to the council`;
    if (
      isRemoveMemberFromRole(this.data.kind) &&
      this.data.kind.RemoveMemberFromRole.role === 'council'
    )
      return `Remove ${this.data.kind.RemoveMemberFromRole.member_id} from the council`;
    if (isTransfer(this.data.kind) && this.data.kind.Transfer.token_id === '') {
      const amount = this._Chain.coins(this.data.kind.Transfer.amount);
      return `${'Request for payout Ⓝ'}${amount.inDollars
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')} to ${
        this.data.kind.Transfer.receiver_id
      }`;
    } else if (isTransfer(this.data.kind)) {
      const amount = this._Chain.coins(this.data.kind.Transfer.amount);
      return `${'Request for payout '}${amount.inDollars
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${
        this.data.kind.Transfer.token_id
      } to ${this.data.kind.Transfer.receiver_id}`;
    }
    // TODO: support custom decimals
    if (
      isFunctionCall(this.data.kind) &&
      this.data.kind.FunctionCall.actions[0].method_name === 'create_token'
    )
      return 'Create token';
    if (isFunctionCall(this.data.kind)) {
      return `Call ${this.data.kind.FunctionCall.actions[0].method_name} on ${this.data.kind.FunctionCall.receiver_id}`;
    }
    return `Sputnik Proposal ${this.identifier}`;
  }

  public get description() {
    return this.data.description;
  }

  public get author() {
    return this._Accounts.get(this.data.proposer);
  }

  public get votingType() {
    return VotingType.YesNoReject;
  }

  public get votingUnit() {
    return this._votePolicy.weight_kind === WeightKind.RoleWeight
      ? VotingUnit.OnePersonOneVote
      : VotingUnit.CoinVote;
  }

  public canVoteFrom(account: NearAccount) {
    // technically we should check on each role separately, but for now we
    // confirm they have all 3 voting roles
    const permissions = getUserRoles(this._Dao.policy, account.address);
    const permissionTypes = permissions.map((p) => p.split(':')[1]);
    return (
      permissionTypes.includes('VoteApprove') &&
      permissionTypes.includes('VoteReject') &&
      permissionTypes.includes('VoteRemove')
    );
  }

  private _Chain: NearChain;
  private _Accounts: NearAccounts;
  private _Dao: NearSputnikDao;

  private _endTimeS: number;
  private _votePolicy: VotePolicy;
  private _totalSupply: BN;

  constructor(
    Chain: NearChain,
    Accounts: NearAccounts,
    Dao: NearSputnikDao,
    data: INearSputnikProposal,
  ) {
    super(ProposalType.SputnikProposal, data);
    this._Chain = Chain;
    this._Accounts = Accounts;
    this._Dao = Dao;

    // init constants from data
    this._votePolicy = getVotePolicy(Dao.policy, data.kind);
    this._totalSupply = getTotalSupply(
      Dao.policy,
      this._votePolicy,
      Dao.tokenSupply,
    );

    const periodS = +this._Dao.policy.proposal_period.slice(
      0,
      this._Dao.policy.proposal_period.length - 9,
    );
    const submissionTimeS = +this.data.submission_time.slice(
      0,
      this.data.submission_time.length - 9,
    );
    this._endTimeS = submissionTimeS + periodS;
    const nowS = moment.now() / 1000;
    if (data.status !== NearSputnikProposalStatus.InProgress) {
      this.complete(this._Dao.store);
    } else if (this._endTimeS < nowS) {
      console.log(
        `Marking proposal ${this.identifier} expired, by ${
          nowS - this._endTimeS
        } seconds.`,
      );
      // special case for expiration that hasn't yet been triggered
      data.status = NearSputnikProposalStatus.Expired;
      this.complete(this._Dao.store);
    }
    // TODO: fetch weights for each voter? is this necessary?
    for (const [voter, choice] of Object.entries(data.votes)) {
      this.addOrUpdateVote(
        new NearSputnikVote(this._Accounts.get(voter), choice),
      );
    }
    this._Dao.store.add(this);
  }

  private _getVoteCounts(): [BN, BN, BN] {
    const counts = this.data.vote_counts;
    if (Object.keys(counts).length === 0) {
      return [new BN(0), new BN(0), new BN(0)];
    } else {
      // TODO: don't just use the first value on the object, do a proper role check
      const [yes, no, remove] = Object.values(this.data.vote_counts)[0];
      return [new BN(yes), new BN(no), new BN(remove)];
    }
  }

  public update() {
    throw new Error('unimplemented');
  }

  get support() {
    // TODO: don't just use the first value on the object, do a proper role check
    const [yes] = Object.values(this.data.vote_counts)[0];
    // will be either total vote weight or # of yes votes depending on type
    return yes;
  }

  // percentage of voters or percentage of tokens depending on type of vote
  get turnout() {
    const PRECISION = 10_000;
    const [yes, no, remove] = this._getVoteCounts();
    const totalVoted = yes.add(no).add(remove);
    const pctVoted =
      totalVoted.muln(PRECISION).div(this._totalSupply).toNumber() / PRECISION;
    return pctVoted;
  }

  get endTime(): ProposalEndTime {
    return { kind: 'fixed', time: moment.unix(this._endTimeS) };
  }

  get isPassing(): ProposalStatus {
    if (this.data.status === NearSputnikProposalStatus.InProgress) {
      // TODO: check quorum in addition to just threshold
      let threshold: BN;
      if (isWeight(this._votePolicy.threshold)) {
        // weight threshold: must have enough votes
        threshold = BN.min(
          this._totalSupply,
          new BN(this._votePolicy.threshold),
        );
      } else {
        // ratio threshold: must have sufficient proportion
        const [numerator, denominator] = this._votePolicy.threshold;
        threshold = BN.min(
          this._totalSupply
            .muln(+numerator)
            .divn(+denominator)
            .addn(1),
          this._totalSupply,
        );
      }
      const [yes, no, remove] = this._getVoteCounts();
      if (yes.gte(threshold)) {
        return ProposalStatus.Passing;
      } else {
        // TODO: compute separate states for ready to pass/fail/remove
        return ProposalStatus.Failing;
      }
    } else if (this.data.status === NearSputnikProposalStatus.Approved) {
      return ProposalStatus.Passed;
    } else {
      return ProposalStatus.Failed;
    }
  }

  public async submitVoteWebTx(vote: NearSputnikVote) {
    const account = this._Dao.app.user.activeAccount as NearAccount;
    if (account.address !== vote.account.address) {
      throw new Error('Invalid vote address!');
    }

    // TODO: user pre-checks

    const contractId = this._Dao.app.activeChainId();
    const methodName = 'act_proposal';
    const args = {
      id: this.data.id,
      action: `Vote${vote.choice}`,
    };
    await this._Chain.redirectTx(
      contractId,
      methodName,
      args,
      undefined,
      window.location.href,
    );
  }

  public submitVoteTx(vote: NearSputnikVote): ITXModalData {
    throw new Error('unsupported');
  }
}
