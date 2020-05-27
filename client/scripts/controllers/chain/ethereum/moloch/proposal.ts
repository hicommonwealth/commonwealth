import BN from 'bn.js';
import moment from 'moment';

import { MolochShares } from 'adapters/chain/ethereum/types';
import { IMolochProposalResponse, IMolochVote } from 'adapters/chain/moloch/types';
import { ICompletable } from 'adapters/shared';

import {
  Proposal,
  IVote,
  ITXModalData,
  VotingType,
  VotingUnit,
  ProposalStatus,
  ProposalEndTime
} from 'models';

import MolochMember from './member';
import MolochMembers from './members';
import MolochAPI from './api';
import MolochGovernance from './governance';

export enum MolochVote {
  NULL = 'Null',
  YES = 'Yes',
  NO = 'No'
}

export enum MolochProposalState {
  NotStarted,
  Voting,
  GracePeriod,
  InProcessingQueue,
  ReadyToProcess,
  Processed
}

export class MolochProposalVote implements IVote<MolochShares> {
  public readonly account: MolochMember;
  public readonly choice: MolochVote;

  constructor(member: MolochMember, choice: MolochVote) {
    this.account = member;
    this.choice = choice;
  }
}

export default class MolochProposal extends Proposal<
  MolochAPI,
  MolochShares,
  IMolochProposalResponse,
  MolochProposalVote
> {
  private _Members: MolochMembers;
  private _Gov: MolochGovernance;

  private _yesShares: number;
  private _noShares: number;

  public get shortIdentifier() { return 'MGP-' + this.data.identifier; }
  public get title() {
    try {
      const parsed = JSON.parse(this.data.details);
      if (parsed.hasOwnProperty('title')) {
        return parsed.title;
      }
    } catch {
      if (this.data.details) {
        return this.data.details;
      } else {
        return 'Moloch Proposal #' + this.data.identifier;
      }
    }
  }
  public get description() {
    try {
      const parsed = JSON.parse(this.data.details);
      if (parsed.hasOwnProperty('description')) {
        return parsed.description;
      }
    } catch {
      return '';
    }
  }

  public get author() { return this._Members.get(this.data.delegateKey); }
  public get applicantAddress() { return this.data.applicantAddress; }

  public get votingType() { return VotingType.MolochYesNo; }
  public get votingUnit() { return VotingUnit.CoinVote; }

  public get startingPeriod() { return +this.data.startingPeriod; }
  public get votingPeriodEnd() { return this.startingPeriod + +this._Gov.votingPeriodLength; }
  public get gracePeriodEnd() { return this.votingPeriodEnd + +this._Gov.gracePeriod; }
  public get abortPeriodEnd() { return this.startingPeriod + +this._Gov.abortWindow; }

  public get state(): MolochProposalState {
    const currentPeriod = this._Gov.currentPeriod;
    if (this.startingPeriod > currentPeriod) {
      return MolochProposalState.NotStarted;
    } else if (this.startingPeriod <= currentPeriod && currentPeriod < this.votingPeriodEnd) {
      return MolochProposalState.Voting;
    } else if (this.votingPeriodEnd <= currentPeriod && currentPeriod < this.gracePeriodEnd) {
      return MolochProposalState.GracePeriod;
    } else if (this.gracePeriodEnd < currentPeriod && !this.data.processed) {
      // has previous proposal been processed?
      // this should always be available, but we might need to load this property
      // at init time if we implement e.g. paginated loading
      const prevProposal = this._Gov.store.getByIdentifier(+this.identifier - 1);
      if (!prevProposal || prevProposal.data.processed) {
        return MolochProposalState.ReadyToProcess;
      } else {
        return MolochProposalState.InProcessingQueue;
      }
    } else if (this.data.processed) {
      return MolochProposalState.Processed;
    } else {
      throw new Error('invalid moloch proposal state');
    }
  }

  public get endTime(): ProposalEndTime {
    let endPeriod;
    const state = this.state;

    // update end timer based on current state
    if (state === MolochProposalState.NotStarted) {
      endPeriod = this.startingPeriod;
    } else if (state === MolochProposalState.Voting) {
      endPeriod = this.votingPeriodEnd;
    } else {
      endPeriod = this.gracePeriodEnd;
    }
    const endTimestamp = this._Gov.summoningTime.add(this._Gov.periodDuration.muln(endPeriod));
    return { kind: 'fixed', time: moment.unix(endTimestamp.toNumber()) };
  }

  public get isAborted() {
    return this.data.status === 'ABORTED' || this.data.aborted;
  }

  public get isPassing() {
    if (this.data.status === 'PASSED' || this.data.didPass) return ProposalStatus.Passed;
    if (this.data.status === 'FAILED' || this.data.status === 'ABORTED' || this.data.aborted || this.data.processed) return ProposalStatus.Failed;
    if (this.state === MolochProposalState.Voting || this.state === MolochProposalState.NotStarted) {
      return new BN(this._yesShares).gt(new BN(this._noShares)) ? ProposalStatus.Passing : ProposalStatus.Failing;
    } else {
      return new BN(this._yesShares).gt(new BN(this._noShares)) ? ProposalStatus.Passed : ProposalStatus.Failed;
    }
  }

  public get support() {
    // Since BNs only represent integers, we multiply the numerator by some value P
    // then perform division (P * yes) / (yes + no), which equals P * support, where
    // support is from 0 to 1. We then convert that value to a float (since it should be <= P),
    // and divide the result by P to obtain the support value between 0 and 1.
    //
    // The entire process can be summarized as: support = float((P * yes) / (yes + n)) / P,
    // where "yes" and "no" are integers.
    const PRECISION = 1000;
    const voters = new BN(this._yesShares).add(new BN(this._noShares));
    if (voters.isZero()) return 0;
    const pctYes = new BN(this._yesShares).muln(PRECISION).div(voters);
    return pctYes.toNumber() / PRECISION;
  }

  public get turnout() {
    // see support call for explanation of precision usage
    const PRECISION = 1000;
    const votes = new BN(this._yesShares).add(new BN(this._noShares));
    if (this._Gov.totalShares.isZero()) return 0;
    const pctTurnout = votes.muln(PRECISION).div(this._Gov.totalShares);
    return pctTurnout.toNumber() / PRECISION;
  }

  constructor(
    MolochMembers: MolochMembers,
    MolochProposals: MolochGovernance,
    data: IMolochProposalResponse
  ) {
    // must set identifier before super() because of how response object is named
    data.identifier = data.id;
    super('molochproposal', data);

    this._Members = MolochMembers;
    this._Gov = MolochProposals;

    this._yesShares = data.yesVotes
      ? +data.yesVotes
      : data.votes.reduce((n, v) => v.uintVote === 1 ? n + (+v.member.shares) : n, 0);
    this._noShares = data.noVotes
      ? +data.noVotes
      : data.votes.reduce((n, v) => v.uintVote === 2 ? n + (+v.member.shares) : n, 0);

    // populate votes from member data
    this._addOrUpdateVotes(data.votes);

    this._Gov.store.add(this);
  }

  public update() {
    throw new Error('unimplemented');
  }

  public canVoteFrom(account: MolochMember) {
    // We need to check the delegate of account to perform voting checks. Delegates must
    // be fetched from chain, which requires async calls, making this impossible to implement.
    return true;
  }

  public canAbort(currentUser: MolochMember) {
    if (currentUser.address.toLowerCase() !== this.data.applicantAddress.toLowerCase()) {
      return false;
    }
    return this._Gov.currentPeriod < this.abortPeriodEnd;
  }

  // web wallet TX only
  public async submitVoteWebTx(vote: MolochProposalVote) {
    if (!(await this._Members.isSenderDelegate())) {
      throw new Error('sender must be valid delegate');
    }

    if (this.state !== MolochProposalState.Voting) {
      throw new Error('proposal not in voting period');
    }

    if (this.isAborted) {
      throw new Error('proposal aborted');
    }

    const prevVote = await this._Gov.api.Contract.getMemberProposalVote(
      this._Gov.api.userAddress,
      this.data.identifier
    );
    if (prevVote === 1 || prevVote === 2) {
      throw new Error('user previously voted on proposal');
    }

    const tx = await this._Gov.api.Contract.submitVote(
      this.data.identifier,
      vote.choice === MolochVote.YES ? 1 : vote.choice === MolochVote.NO ? 2 : 0,
      { gasLimit: this._Gov.api.gasLimit },
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to submit vote');
    }

    // trigger update to refresh vote stats
    await this.refreshData();
    return txReceipt;
  }

  public submitVoteTx(): ITXModalData {
    throw new Error('not implemented');
  }

  // V2 only
  public async sponsorTx() {
    throw new Error('not yet implemented');
  }

  public async processTx() {
    if (this.state !== MolochProposalState.ReadyToProcess) {
      throw new Error('proposal not ready to process');
    }

    const tx = await this._Gov.api.Contract.processProposal(
      this.data.identifier,
      { gasLimit: this._Gov.api.gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to process proposal');
    }

    // trigger update to refresh vote stats
    await this.refreshData();
    return txReceipt;
  }

  public async abortTx() {
    if (this.isAborted) {
      throw new Error('proposal already aborted');
    }

    if (!this.canAbort) {
      throw new Error('proposal not in abort window');
    }

    if (this._Gov.api.userAddress !== this.applicantAddress) {
      throw new Error('only applicant can abort');
    }

    const tx = await this._Gov.api.Contract.abort(
      this.data.identifier,
      { gasLimit: this._Gov.api.gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to abort proposal');
    }

    // trigger update to refresh vote stats
    await this.refreshData();
    return txReceipt;
  }

  // re-fetches data from the chain, either on the server or client
  private async refreshData() {
    if (this._Gov.useChainProposalData) {
      const rawProposal = await this._Gov.api.Contract.proposalQueue(this.data.identifier);
      this._data = this._Gov.convertChainProposal(+this.data.id, rawProposal);
    } else {
      throw new Error('chain object fetching from backend unsupported');
    }

    // compute new vote % data
    this._yesShares = this.data.yesVotes
      ? +this.data.yesVotes
      : this.data.votes.reduce((n, v) => v.uintVote === 1 ? n + (+v.member.shares) : n, 0);
    this._noShares = this.data.noVotes
      ? +this.data.noVotes
      : this.data.votes.reduce((n, v) => v.uintVote === 2 ? n + (+v.member.shares) : n, 0);
  }

  // updates multiple votes at once
  private _addOrUpdateVotes(votes: IMolochVote[]) {
    for (const vote of votes) {
      this.addOrUpdateVote(new MolochProposalVote(
        this._Members.getFromJSON(vote.member),
        vote.uintVote === 1 ? MolochVote.YES : vote.uintVote === 2 ? MolochVote.NO : MolochVote.NULL,
      ));
    }
  }
}
