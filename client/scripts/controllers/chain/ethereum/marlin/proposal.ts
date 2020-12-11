import BN from 'bn.js';
import moment from 'moment';

import { MPond, EthereumCoin } from 'adapters/chain/ethereum/types';
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
import MarlinGovernance from './governance';

export enum MarlinVote {
  YES = 1,
  NO = 0
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

const backportEntityToAdapter = (
  Gov: MarlinGovernance,
  entity: ChainEntity
): IMarlinProposalResponse => {
  // TODO: Uncomment when Chain-events is being imported
  // const startEvent = entity.chainEvents.find((e) => e.data.kind === MarlinTypes.EventKind.ProposalCreated);
  // const canceledEvent = entity.chainEvents.find((e) => e.data.kind === MarlinTypes.EventKind.ProposalCanceled);
  // const executedEvent = entity.chainEvents.find((e) => e.data.kind === MarlinTypes.EventKind.ProposalExecuted);
  // const voteEvents = entity.chainEvents.filter((e) => e.data.kind === MarlinTypes.EventKind.VoteCast);
  // if (!startEvent) {
  //   throw new Error('Proposal start event not found!');
  // }

  // const identifier = `${(startEvent.data as MarlinTypes.IProposalCreated).id}`;
  // const id = identifier;
  // const proposer = `${(startEvent.data as MarlinTypes.IProposalCreated).proposer}`;
  // const description = `${(startEvent.data as MarlinTypes.IProposalCreated).description}`;
  // const targets = (startEvent.data as MarlinTypes.IProposalCreated).targets;
  // const values = (startEvent.data as MarlinTypes.IProposalCreated).values;
  // const signatures = (startEvent.data as MarlinTypes.IProposalCreated).signatures;
  // const calldatas = (startEvent.data as MarlinTypes.IProposalCreated).calldatas;
  // const startBlock = (startEvent.data as MarlinTypes.IProposalCreated).startBlock;
  // const endBlock = (startEvent.data as MarlinTypes.IProposalCreated).endBlock;
  // const eta = null;

  // const voteReducer = (acc, vote) => acc + vote.votes.toNumber();
  // const forVotesArray = voteEvents.filter((e) => e.data.support);
  // const forVotes = forVotesArray.reduce(voteReducer, 0);
  // const againstVotesArray = voteEvents.filter((e) => !e.data.support);
  // const againstVotes = againstVotesArray.reduce(voteReducer, 0);
  // const canceled = !!canceledEvent;
  // const executed = !!executedEvent;

  // const proposal: IMarlinProposalResponse = {
  //   identifier,
  //   id,
  //   proposer,
  //   description,
  //   targets,
  //   values,
  //   signatures,
  //   calldatas,
  //   startBlock,
  //   endBlock,
  //   eta,
  //   forVotes,
  //   againstVotes,
  //   canceled,
  //   executed,
  // };

  const proposal: IMarlinProposalResponse = {
    identifier: null,
    id: null,
    proposer: null,
    description: null,
    targets: null,
    values: null,
    signatures: null,
    calldatas: null,
    startBlock: null,
    endBlock: null,
    eta: null,
    forVotes: null,
    againstVotes: null,
    canceled: null,
    executed: null,
  };

  return proposal;
};


export default class MarlinProposal extends Proposal<
  MarlinAPI,
  EthereumCoin,
  IMarlinProposalResponse,
  MarlinProposalVote
> {
  private _Holders: MarlinHolders;
  private _Gov: MarlinGovernance;

  public get shortIdentifier() { return `MarlinProposal-${this.data.identifier}`; }
  public get title(): string {
    try {
      const parsed = JSON.parse(this.data.description);
      // eslint-disable-next-line no-prototype-builtins
      if (parsed && parsed.hasOwnProperty('title')) {
        return parsed.title as string;
      } else {
        return this.data.description;
      }
    } catch {
      if (this.data.description) {
        return this.data.description;
      } else {
        return `Marlin Proposal #${this.data.identifier}`;
      }
    }
  }
  public get description(): string {
    return '';
  }

  public get isPassing(): ProposalStatus {
    return ProposalStatus.Passing;
  }

  public get author() { return this._Holders.get(this.data.proposer); }

  public get votingType() { return VotingType.MarlinYesNo; }
  public get votingUnit() { return VotingUnit.CoinVote; }

  public get startingPeriod() { return +this.data.startBlock; }
  public get votingPeriodEnd() { return this.startingPeriod + +this._Gov.votingPeriod; }

  public async state(): Promise<MarlinProposalState> {
    const state = await this._Gov.state(this.identifier);
    return state;
  }

  public get endTime(): ProposalEndTime { // TODO: Get current block and subtract from endBlock * 15s
    return { kind: 'fixed', time: moment.unix(this.data.endBlock) };
  }

  public get endBlock(): ProposalEndTime {
    return this.endTime;
  }

  public get isCanceled() {
    return this.data.canceled;
  }

  public get support() {
    return 0;
  }

  public get turnout() {
    return null;
  }

  constructor(
    Holders: MarlinHolders,
    Gov: MarlinGovernance,
    entity: ChainEntity,
  ) {
    // must set identifier before super() because of how response object is named
    // TODO: Fix BackPortEntityToAdapter for this to work
    super('marlinproposal', backportEntityToAdapter(Gov, entity));

    this._Holders = Holders;
    this._Gov = Gov;

    entity.chainEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber).forEach((e) => this.update(e));
    this._initialized.next(true);
    this._Gov.store.add(this);
  }

  public update(e: ChainEvent) {
  }

  public canVoteFrom(account: MarlinHolder) {
    // We need to check the delegate of account to perform voting checks. Delegates must
    // be fetched from chain, which requires async calls, making this impossible to implement.
    return true;
  }

  public async cancelTx() {
    if (this.isCanceled) {
      throw new Error('proposal already canceled');
    }

    const tx = await this._Gov.api.governorAlphaContract.cancel(
      this.data.identifier,
      { gasLimit: this._Gov.api.gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to canceled proposal');
    }
    return txReceipt;
  }

  // web wallet TX only
  public async submitVoteWebTx(vote: MarlinProposalVote) {
    if (!(await this._Holders.isSenderDelegate())) {
      throw new Error('sender must be valid delegate');
    }

    if (await this.state() !== MarlinProposalState.Active) {
      throw new Error('proposal not in active period');
    }

    const tx = await this._Gov.api.governorAlphaContract.castVote(
      this.data.identifier,
      !!vote.choice,
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
}
