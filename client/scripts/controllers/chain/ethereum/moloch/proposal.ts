import BN from 'bn.js';
import moment from 'moment';

import { MolochShares, EthereumCoin } from 'adapters/chain/ethereum/types';
import { IMolochProposalResponse } from 'adapters/chain/moloch/types';
import {
  MolochEventKind, IMolochSubmitProposal, IMolochProcessProposal
} from 'commonwealth-chain-events/dist/src/moloch/types';

import {
  Proposal,
  IVote,
  ITXModalData,
  VotingType,
  VotingUnit,
  ProposalStatus,
  ProposalEndTime,
  ChainEntity,
  ChainEvent,
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

export class MolochProposalVote implements IVote<EthereumCoin> {
  public readonly account: MolochMember;
  public readonly choice: MolochVote;

  constructor(member: MolochMember, choice: MolochVote) {
    this.account = member;
    this.choice = choice;
  }
}

const backportEntityToAdapter = (
  Gov: MolochGovernance,
  entity: ChainEntity
): IMolochProposalResponse => {
  const startEvent = entity.chainEvents.find((e) => e.data.kind === MolochEventKind.SubmitProposal);
  const processEvent = entity.chainEvents.find((e) => e.data.kind === MolochEventKind.ProcessProposal);
  const abortEvent = entity.chainEvents.find((e) => e.data.kind === MolochEventKind.Abort);
  if (!startEvent) {
    throw new Error('Proposal start event not found!');
  }
  const identifier = `${(startEvent.data as IMolochSubmitProposal).proposalIndex}`;
  const id = identifier;
  const details = (startEvent.data as IMolochSubmitProposal).details;
  const timestamp = `${(startEvent.data as IMolochSubmitProposal).startTime}`;
  const startingPeriod = (new BN(timestamp, 10)).sub(Gov.summoningTime).div(Gov.periodDuration).toString(10);
  const delegateKey = (startEvent.data as IMolochSubmitProposal).member;
  const applicantAddress = (startEvent.data as IMolochSubmitProposal).applicant;
  const tokenTribute = (startEvent.data as IMolochSubmitProposal).tokenTribute;
  const sharesRequested = (startEvent.data as IMolochSubmitProposal).sharesRequested;
  const processed = !!processEvent;
  const proposal: IMolochProposalResponse = {
    identifier,
    id,
    details,
    timestamp,
    startingPeriod,
    delegateKey,
    applicantAddress,
    tokenTribute,
    sharesRequested,
    processed,
    votes: [],
  };

  // optional properties
  if (processEvent) {
    proposal.didPass = (processEvent.data as IMolochProcessProposal).didPass;
    proposal.aborted = false;
    proposal.status = proposal.didPass ? 'PASSED' : 'FAILED';
    proposal.yesVotes = (processEvent.data as IMolochProcessProposal).yesVotes;
    proposal.yesVotes = (processEvent.data as IMolochProcessProposal).noVotes;
  }
  if (abortEvent) {
    proposal.didPass = false;
    proposal.aborted = true;
    proposal.status = 'ABORTED';
  }
  return proposal;
};


export default class MolochProposal extends Proposal<
  MolochAPI,
  EthereumCoin,
  IMolochProposalResponse,
  MolochProposalVote
> {
  private _Members: MolochMembers;
  private _Gov: MolochGovernance;

  private _yesShares: number = 0;
  private _noShares: number = 0;

  public get shortIdentifier() { return `MGP-${this.data.identifier}`; }
  public get title(): string {
    try {
      const parsed = JSON.parse(this.data.details);
      // eslint-disable-next-line no-prototype-builtins
      if (parsed && parsed.hasOwnProperty('title')) {
        return parsed.title as string;
      } else {
        return this.data.details;
      }
    } catch {
      if (this.data.details) {
        return this.data.details;
      } else {
        return `Moloch Proposal #${this.data.identifier}`;
      }
    }
  }
  public get description(): string {
    try {
      const parsed = JSON.parse(this.data.details);
      // eslint-disable-next-line no-prototype-builtins
      if (parsed && parsed.hasOwnProperty('description')) {
        return parsed.description as string;
      } else {
        return '';
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
    if (this.data.status === 'FAILED' || this.data.status === 'ABORTED' || this.data.aborted || this.data.processed) {
      return ProposalStatus.Failed;
    }
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
    Members: MolochMembers,
    Gov: MolochGovernance,
    entity: ChainEntity,
  ) {
    // must set identifier before super() because of how response object is named
    super('molochproposal', backportEntityToAdapter(Gov, entity));

    this._Members = Members;
    this._Gov = Gov;

    entity.chainEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber).forEach((e) => this.update(e));
    this._initialized.next(true);
    this._Gov.store.add(this);
  }

  public update(e: ChainEvent) {
    if (this.completed) {
      return;
    }
    switch (e.data.kind) {
      case MolochEventKind.SubmitProposal: {
        break;
      }
      case MolochEventKind.SubmitVote: {
        const memberJson = {
          id: e.data.member,
          delegateKey: e.data.delegateKey,
          shares: e.data.shares,
          highestIndexYesVote: `${e.data.highestIndexYesVote}`,
        };
        const member = this._Members.getFromJSON(memberJson);
        const choice = e.data.vote === 1 ? MolochVote.YES : e.data.vote === 2 ? MolochVote.NO : MolochVote.NULL;
        this.addOrUpdateVote(new MolochProposalVote(member, choice));
        if (choice === MolochVote.YES) {
          this._yesShares += +e.data.shares;
        } else if (choice === MolochVote.NO) {
          this._noShares += +e.data.shares;
        }
        break;
      }
      case MolochEventKind.Abort: {
        this.data.aborted = true;
        this.data.didPass = false;
        this.data.status = 'ABORTED';
        this.complete(this._Gov.store);
        break;
      }
      case MolochEventKind.ProcessProposal: {
        this.data.processed = true;
        this.data.aborted = false;
        this.data.didPass = e.data.didPass;
        this.data.status = e.data.didPass ? 'PASSED' : 'FAILED';
        this._yesShares = +e.data.yesVotes;
        this._noShares = +e.data.noVotes;
        this.complete(this._Gov.store);
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
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
    return txReceipt;
  }

  public async abortTx() {
    if (this.isAborted) {
      throw new Error('proposal already aborted');
    }

    if (!this.canAbort) {
      throw new Error('proposal not in abort window');
    }

    if (this._Gov.api.userAddress.toLowerCase() !== this.applicantAddress.toLowerCase()) {
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
    return txReceipt;
  }
}
