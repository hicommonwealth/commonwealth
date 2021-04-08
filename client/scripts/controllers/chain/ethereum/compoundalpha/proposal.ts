import moment from 'moment';

import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { ICompoundalphaProposalResponse } from 'adapters/chain/compoundalpha/types';

import { CompoundalphaTypes } from '@commonwealth/chain-events';

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

import CompoundalphaHolder from './holder';
import CompoundalphaHolders from './holders';
import CompoundalphaAPI from './api';
import CompoundalphaGovernance from './governance';

export enum CompoundalphaVote {
  YES = 1,
  NO = 0
}

export enum CompoundalphaProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed
}

export class CompoundalphaProposalVote implements IVote<EthereumCoin> {
  public readonly account: CompoundalphaHolder;
  public readonly choice: CompoundalphaVote;

  constructor(member: CompoundalphaHolder, choice: CompoundalphaVote) {
    this.account = member;
    this.choice = choice;
  }
}

const backportEntityToAdapter = (
  Gov: CompoundalphaGovernance,
  entity: ChainEntity
): ICompoundalphaProposalResponse => {
  const startEvent = entity.chainEvents.find((e) => e.data.kind === CompoundalphaTypes.EventKind.ProposalCreated);
  const canceledEvent = entity.chainEvents.find((e) => e.data.kind === CompoundalphaTypes.EventKind.ProposalCanceled);
  const executedEvent = entity.chainEvents.find((e) => e.data.kind === CompoundalphaTypes.EventKind.ProposalExecuted);
  const voteEvents = entity.chainEvents.filter((e) => e.data.kind === CompoundalphaTypes.EventKind.VoteCast);
  if (!startEvent) {
    throw new Error('Proposal start event not found!');
  }

  const identifier = `${(startEvent.data as CompoundalphaTypes.IProposalCreated).id}`;
  const id = identifier;
  const proposer = `${(startEvent.data as CompoundalphaTypes.IProposalCreated).proposer}`;
  const description = `${(startEvent.data as CompoundalphaTypes.IProposalCreated).description}`;
  const targets = (startEvent.data as CompoundalphaTypes.IProposalCreated).targets;
  const values = (startEvent.data as CompoundalphaTypes.IProposalCreated).values;
  const signatures = (startEvent.data as CompoundalphaTypes.IProposalCreated).signatures;
  const calldatas = (startEvent.data as CompoundalphaTypes.IProposalCreated).calldatas;
  const startBlock = (startEvent.data as CompoundalphaTypes.IProposalCreated).startBlock;
  const endBlock = (startEvent.data as CompoundalphaTypes.IProposalCreated).endBlock;
  const eta = null;

  const voteReducer = (acc, vote) => acc + vote.votes.toNumber();
  const forVotesArray = voteEvents.filter((e) => (e.data as CompoundalphaTypes.IVoteCast).support);
  const forVotes = forVotesArray.reduce(voteReducer, 0);
  const againstVotesArray = voteEvents.filter((e) => !(e.data as CompoundalphaTypes.IVoteCast).support);
  const againstVotes = againstVotesArray.reduce(voteReducer, 0);
  const canceled = !!canceledEvent;
  const executed = !!executedEvent;

  const proposal: ICompoundalphaProposalResponse = {
    identifier,
    id,
    proposer,
    description,
    targets,
    values,
    signatures,
    calldatas,
    startBlock,
    endBlock,
    eta,
    forVotes,
    againstVotes,
    canceled,
    executed,
  };

  return proposal;
};


export default class CompoundalphaProposal extends Proposal<
  CompoundalphaAPI,
  EthereumCoin,
  ICompoundalphaProposalResponse,
  CompoundalphaProposalVote
> {
  private _Holders: CompoundalphaHolders;
  private _Gov: CompoundalphaGovernance;

  public get shortIdentifier() { return `CompoundalphaProposal-${this.data.identifier}`; }
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
        return `Compoundalpha Proposal #${this.data.identifier}`;
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

  public get votingType() { return VotingType.CompoundalphaYesNo; }
  public get votingUnit() { return VotingUnit.CoinVote; }

  public get startingPeriod() { return +this.data.startBlock; }
  public get votingPeriodEnd() { return this.startingPeriod + +this._Gov.votingPeriod; }

  public async state(): Promise<CompoundalphaProposalState> {
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
    Holders: CompoundalphaHolders,
    Gov: CompoundalphaGovernance,
    entity: ChainEntity,
  ) {
    // must set identifier before super() because of how response object is named
    super('Compoundalphaproposal', backportEntityToAdapter(Gov, entity));

    this._Holders = Holders;
    this._Gov = Gov;

    entity.chainEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber).forEach((e) => this.update(e));
    this._initialized = true;
    this._Gov.store.add(this);
  }

  public update(e: ChainEvent) {
  }

  public canVoteFrom(account: CompoundalphaHolder) {
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
  public async submitVoteWebTx(vote: CompoundalphaProposalVote) {
    if (!(await this._Holders.isSenderDelegate())) {
      throw new Error('sender must be valid delegate');
    }

    if (await this.state() !== CompoundalphaProposalState.Active) {
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
