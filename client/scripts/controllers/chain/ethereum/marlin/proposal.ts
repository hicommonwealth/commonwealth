import BN from 'bn.js';
import moment from 'moment';

// TODO: check MarlinComp name
import { MarlinComp, EthereumCoin } from 'adapters/chain/ethereum/types';
import { IMarlinProposalResponse } from 'adapters/chain/marlin/types';
// import { MarlinTypes } from '@commonwealth/chain-events';

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

import MarlinHolder from './holder';
import MarlinHolders from './holders';
import MarlinAPI from './api';
// import MarlinGovernance from './governance';

export enum MarlinVote {
  YES = 'Yes',
  NO = 'No'
}

export enum MarlinProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed
}

export class MarlinProposalVote implements IVote<EthereumCoin> {
  public readonly account: MarlinHolder;
  public readonly choice: MarlinVote;

  constructor(member: MarlinHolder, choice: MarlinVote) {
    this.account = member;
    this.choice = choice;
  }
}

// TODO: Uncomment/Implement
// const backportEntityToAdapter = (
//   Gov: MarlinGovernance,
//   entity: ChainEntity
// ): IMarlinProposalResponse => {
//   const startEvent = entity.chainEvents.find((e) => e.data.kind === MarlinTypes.EventKind.SubmitProposal);
//   const processEvent = entity.chainEvents.find((e) => e.data.kind === MarlinTypes.EventKind.ProcessProposal);
//   const abortEvent = entity.chainEvents.find((e) => e.data.kind === MarlinTypes.EventKind.Abort);
//   if (!startEvent) {
//     throw new Error('Proposal start event not found!');
//   }
//   const identifier = `${(startEvent.data as MarlinTypes.ISubmitProposal).proposalIndex}`;
//   const id = identifier;
//   const details = (startEvent.data as MarlinTypes.ISubmitProposal).details;
//   const timestamp = `${(startEvent.data as MarlinTypes.ISubmitProposal).startTime}`;
//   const startingPeriod = (new BN(timestamp, 10)).sub(Gov.summoningTime).div(Gov.periodDuration).toString(10);
//   const delegateKey = (startEvent.data as MarlinTypes.ISubmitProposal).member;
//   const applicantAddress = (startEvent.data as MarlinTypes.ISubmitProposal).applicant;
//   const tokenTribute = (startEvent.data as MarlinTypes.ISubmitProposal).tokenTribute;
//   const sharesRequested = (startEvent.data as MarlinTypes.ISubmitProposal).sharesRequested;
//   const processed = !!processEvent;
//   const proposal: IMarlinProposalResponse = {
//     identifier,
//     id,
//     details,
//     timestamp,
//     startingPeriod,
//     delegateKey,
//     applicantAddress,
//     tokenTribute,
//     sharesRequested,
//     processed,
//     votes: [],
//   };

//   // optional properties
//   if (processEvent) {
//     proposal.didPass = (processEvent.data as MarlinTypes.IProcessProposal).didPass;
//     proposal.aborted = false;
//     proposal.status = proposal.didPass ? 'PASSED' : 'FAILED';
//     proposal.yesVotes = (processEvent.data as MarlinTypes.IProcessProposal).yesVotes;
//     proposal.yesVotes = (processEvent.data as MarlinTypes.IProcessProposal).noVotes;
//   }
//   if (abortEvent) {
//     proposal.didPass = false;
//     proposal.aborted = true;
//     proposal.status = 'ABORTED';
//   }
//   return proposal;
// };


// export default class MarlinProposal extends Proposal<
//   MarlinAPI,
//   EthereumCoin,
//   IMarlinProposalResponse,
//   MarlinProposalVote
// > {
//   private _Holders: MarlinHolders;
//   private _Gov: MarlinGovernance;

//   private _yesVotes: number = 0;
//   private _noVotes: number = 0;

//   public get shortIdentifier() { return `MGP-${this.data.identifier}`; }
//   public get title(): string {
//     try {
//       const parsed = JSON.parse(this.data.details);
//       // eslint-disable-next-line no-prototype-builtins
//       if (parsed && parsed.hasOwnProperty('title')) {
//         return parsed.title as string;
//       } else {
//         return this.data.details;
//       }
//     } catch {
//       if (this.data.details) {
//         return this.data.details;
//       } else {
//         return `Marlin Proposal #${this.data.identifier}`;
//       }
//     }
//   }
//   public get description(): string {
//     try {
//       const parsed = JSON.parse(this.data.details);
//       // eslint-disable-next-line no-prototype-builtins
//       if (parsed && parsed.hasOwnProperty('description')) {
//         return parsed.description as string;
//       } else {
//         return '';
//       }
//     } catch {
//       return '';
//     }
//   }

//   public get author() { return this._Members.get(this.data.delegateKey); }
//   public get applicantAddress() { return this.data.applicantAddress; }

//   public get votingType() { return VotingType.MarlinYesNo; }
//   public get votingUnit() { return VotingUnit.CoinVote; }

//   public get startingPeriod() { return +this.data.startingPeriod; }
//   public get votingPeriodEnd() { return this.startingPeriod + +this._Gov.votingPeriodLength; }
//   public get gracePeriodEnd() { return this.votingPeriodEnd + +this._Gov.gracePeriod; }
//   public get abortPeriodEnd() { return this.startingPeriod + +this._Gov.abortWindow; }

//   public get state(): MarlinProposalState {
//     // TODO: Fetch state from proposal api
//     return MarlinProposalState.Active;
//   }

//   public get endBlock(): ProposalEndTime {
//     const state = this.state;

//     const endTimestamp = this._Gov.summoningTime.add(this._Gov.periodDuration.muln(endPeriod));
//     return { kind: 'fixed', time: moment.unix(endTimestamp.toNumber()) };
//   }

//   public get isCanceled() {
//     return this.data.state === 'Canceled';
//   }

//   public get support() {
//     // Since BNs only represent integers, we multiply the numerator by some value P
//     // then perform division (P * yes) / (yes + no), which equals P * support, where
//     // support is from 0 to 1. We then convert that value to a float (since it should be <= P),
//     // and divide the result by P to obtain the support value between 0 and 1.
//     //
//     // The entire process can be summarized as: support = float((P * yes) / (yes + n)) / P,
//     // where "yes" and "no" are integers.
//     const PRECISION = 1000;
//     const voters = new BN(this._yesVotes).add(new BN(this._noVotes));
//     if (voters.isZero()) return 0;
//     const pctYes = new BN(this._yesVotes).muln(PRECISION).div(voters);
//     return pctYes.toNumber() / PRECISION;
//   }

//   public get turnout() {
//     // see support call for explanation of precision usage
//     const PRECISION = 1000;
//     const votes = new BN(this._yesVotes).add(new BN(this._noVotes));
//     if (this._Gov.totalShares.isZero()) return 0;
//     const pctTurnout = votes.muln(PRECISION).div(this._Gov.totalShares);
//     return pctTurnout.toNumber() / PRECISION;
//   }

//   constructor(
//     Holders: MarlinHolders,
//     Gov: MarlinGovernance,
//     entity: ChainEntity,
//   ) {
//     // must set identifier before super() because of how response object is named
//     // TODO: Fix BackPortEntityToAdapter for this to work
//     super('marlinproposal', backportEntityToAdapter(Gov, entity));

//     this._Holders = Holders;
//     this._Gov = Gov;

//     entity.chainEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber).forEach((e) => this.update(e));
//     this._initialized.next(true);
//     this._Gov.store.add(this);
//   }

//   public update(e: ChainEvent) {
//   }

//   public canVoteFrom(account: MarlinHolder) {
//     // We need to check the delegate of account to perform voting checks. Delegates must
//     // be fetched from chain, which requires async calls, making this impossible to implement.
//     return true;
//   }

//   public canCancel(currentUser: MarlinHolder) {
//   }

//   // web wallet TX only
//   public async submitVoteWebTx(vote: MarlinProposalVote) {
//     if (!(await this._Holders.isSenderDelegate())) {
//       throw new Error('sender must be valid delegate');
//     }

//     if (this.state !== MarlinProposalState.Active) {
//       throw new Error('proposal not in active period');
//     }

//     const prevVote = await this._Gov.api.governorAlpha.getMemberProposalVote(
//       this._Gov.api.userAddress,
//       this.data.identifier
//     );
//     if (prevVote === 1 || prevVote === 2) {
//       throw new Error('user previously voted on proposal');
//     }

//     const tx = await this._Gov.api.governorAlpha.submitVote(
//       this.data.identifier,
//       vote.choice === MarlinVote.YES ? 1 : vote.choice === MarlinVote.NO ? 2 : 0,
//       { gasLimit: this._Gov.api.gasLimit },
//     );
//     const txReceipt = await tx.wait();
//     if (txReceipt.status !== 1) {
//       throw new Error('failed to submit vote');
//     }
//     return txReceipt;
//   }

//   public submitVoteTx(): ITXModalData {
//     throw new Error('not implemented');
//   }

// }
