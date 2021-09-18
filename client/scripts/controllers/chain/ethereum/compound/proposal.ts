import moment from 'moment';
import BN from 'bn.js';

import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';

import { CompoundTypes } from '@commonwealth/chain-events';

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

import CompoundAPI from './api';
import CompoundGovernance from './governance';
import { attachSigner } from '../contractApi';
import EthereumAccount from '../account';
import EthereumAccounts from '../accounts';
import CompoundChain from './chain';
import Web3 from 'web3';
import { formatNumberShort } from 'adapters/currency';

export enum CompoundVote {
  YES = 1,
  NO = 0
}

export class CompoundProposalVote implements IVote<EthereumCoin> {
  public readonly account: EthereumAccount;
  public readonly choice: CompoundVote;
  public readonly power: BN;

  constructor(member: EthereumAccount, choice: CompoundVote, power?: BN) {
    this.account = member;
    this.choice = choice;
    this.power = power || new BN(0);
  }

  public format(): string {
    return `${formatNumberShort(+Web3.utils.fromWei(this.power))}`;
  }
}

const backportEntityToAdapter = (
  Gov: CompoundGovernance,
  entity: ChainEntity
): ICompoundProposalResponse => {
  const startEvent = entity.chainEvents.find((e) => e.data.kind === CompoundTypes.EventKind.ProposalCreated);
  const startData = startEvent.data as CompoundTypes.IProposalCreated;
  return {
    identifier: `${startData.id}`,
    queued: false,
    executed: false,
    cancelled: false,
    completed: false,
    ...startData,
  };
};

const ONE_HUNDRED_WITH_PRECISION = 10000;

function sumVotes(vs: CompoundProposalVote[]): BN {
  return vs.reduce((prev, curr) => {
    return prev.add(curr.power);
  }, new BN(0));
}

export default class CompoundProposal extends Proposal<
  CompoundAPI,
  EthereumCoin,
  ICompoundProposalResponse,
  CompoundProposalVote
> {
  private _Accounts: EthereumAccounts;
  private _Chain: CompoundChain;
  private _Gov: CompoundGovernance;

  public get shortIdentifier() { return `CompoundProposal-${this.data.identifier}`; }
  public get title(): string {
    try {
      const parsed = JSON.parse(this.data.description);
      // eslint-disable-next-line no-prototype-builtins
      if (parsed && parsed.hasOwnProperty('title')) {
        return (parsed.title as string).slice(0, 255);
      } else {
        return this.data.description.slice(0, 255);
      }
    } catch {
      if (this.data.description) {
        return this.data.description.slice(0, 255);
      } else {
        return `Marlin Proposal #${this.data.identifier}`;
      }
    }
  }
  public get description(): string {
    try {
      const parsed = JSON.parse(this.data.description);
      // eslint-disable-next-line no-prototype-builtins
      if (parsed && parsed.hasOwnProperty('description')) {
        return parsed.description as string;
      } else {
        return this.data.description;
      }
    } catch {
      return this.data.description;
    }
  }

  public get isExecutable() {
    // will be Expired if over grace period
    return this.state === CompoundTypes.ProposalState.Queued
      && this.data.eta
      && this.data.eta <= this._Gov.app.chain.block.lastTime.unix();
  }

  public get isPassing(): ProposalStatus {
    switch (this.state) {
      case CompoundTypes.ProposalState.Canceled:
        return ProposalStatus.Canceled;
      case CompoundTypes.ProposalState.Succeeded:
      case CompoundTypes.ProposalState.Queued:
      case CompoundTypes.ProposalState.Executed:
        return ProposalStatus.Passed;
      case CompoundTypes.ProposalState.Expired:
      case CompoundTypes.ProposalState.Defeated:
        return ProposalStatus.Failed;
      case CompoundTypes.ProposalState.Active: {
        const votes = this.getVotes();
        const yesPower = sumVotes(votes.filter((v) => v.choice));
        const noPower = sumVotes(votes.filter((v) => !v.choice));
        const isMajority = yesPower > noPower;
        const isQuorum = yesPower > this._Gov.quorumVotes;
        // TODO: should we omit quorum here for display purposes?
        return isMajority && isQuorum ? ProposalStatus.Passing : ProposalStatus.Failing;
      }
      default:
        // PENDING
        return ProposalStatus.None;
    }
  }

  public get author() { return this._Accounts.get(this.data.proposer); }

  public get votingType() { return VotingType.CompoundYesNo; }
  public get votingUnit() { return VotingUnit.CoinVote; }

  public get startingPeriod() { return +this.data.startBlock; }
  public get votingPeriodEnd() { return this.startingPeriod + +this._Gov.votingPeriod; }

  public get state(): CompoundTypes.ProposalState {
    const blockNumber = this._Gov.app.chain.block.height;
    if (this.data.cancelled) return CompoundTypes.ProposalState.Canceled;
    if (this.data.executed) return CompoundTypes.ProposalState.Executed;
    if (this.data.queued) return CompoundTypes.ProposalState.Queued;
    if (blockNumber <= this.data.startBlock) return CompoundTypes.ProposalState.Pending;
    if (blockNumber <= this.data.endBlock) return CompoundTypes.ProposalState.Active;

    const votes = this.getVotes();
    const yesPower = sumVotes(votes.filter((v) => v.choice));
    const noPower = sumVotes(votes.filter((v) => !v.choice));
    if (yesPower <= noPower || yesPower <= this._Gov.quorumVotes)
      return CompoundTypes.ProposalState.Defeated;
    if (!this.data.eta) return CompoundTypes.ProposalState.Succeeded;
    return CompoundTypes.ProposalState.Expired;
  }

  public get endTime(): ProposalEndTime {
    const state = this.state;

    // waiting to start
    if (state === CompoundTypes.ProposalState.Pending) return { kind: 'fixed_block', blocknum: this.data.startBlock };

    // started
    if (state === CompoundTypes.ProposalState.Active) return { kind: 'fixed_block', blocknum: this.data.endBlock };

    // queued but not ready for execution
    if (state === CompoundTypes.ProposalState.Queued) return { kind: 'fixed', time: moment(this.data.eta) };

    // unavailable if: waiting to passed/failed but not in queue, or completed
    return { kind: 'unavailable' };
  }

  public get endBlock(): ProposalEndTime {
    return this.endTime;
  }

  public get isCancelled() {
    return this.data.cancelled;
  }

  public get isQueueable() {
    return this.state === CompoundTypes.ProposalState.Succeeded;
  }

  public get support() {
    const votes = this.getVotes();
    const yesPower = sumVotes(votes.filter((v) => v.choice));
    const noPower = sumVotes(votes.filter((v) => !v.choice));
    if (yesPower.isZero() && noPower.isZero()) return 0;
    const supportBn = yesPower.muln(ONE_HUNDRED_WITH_PRECISION).div(yesPower.add(noPower));
    return +supportBn / ONE_HUNDRED_WITH_PRECISION;
  }

  // TODO: should this be relative to total supply or quorum required?
  public get turnout() {
    return null;
  }

  constructor(
    Accounts: EthereumAccounts,
    Chain: CompoundChain,
    Gov: CompoundGovernance,
    entity: ChainEntity,
  ) {
    // must set identifier before super() because of how response object is named
    super('compoundproposal', backportEntityToAdapter(Gov, entity));

    this._Accounts = Accounts;
    this._Chain = Chain;
    this._Gov = Gov;

    entity.chainEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber).forEach((e) => this.update(e));

    // special case for expiration because no event is emitted
    if (this.state === CompoundTypes.ProposalState.Expired || this.state === CompoundTypes.ProposalState.Defeated) {
      this.complete(this._Gov.store);
    }

    this._initialized = true;
    this._Gov.store.add(this);
  }

  public update(e: ChainEvent) {
    switch (e.data.kind) {
      case CompoundTypes.EventKind.ProposalCreated: {
        break;
      }
      case CompoundTypes.EventKind.VoteCast: {
        const power = new BN(e.data.votes);
        const vote = new CompoundProposalVote(
          this._Accounts.get(e.data.voter),
          e.data.support ? CompoundVote.YES : CompoundVote.NO,
          power,
        );
        this.addOrUpdateVote(vote);
        break;
      }
      case CompoundTypes.EventKind.ProposalCanceled: {
        this._data.cancelled = true;
        this._data.completed = true;
        this.complete(this._Gov.store);
        break;
      }
      case CompoundTypes.EventKind.ProposalQueued: {
        this._data.queued = true;
        this._data.eta = e.data.eta;
        break;
      }
      case CompoundTypes.EventKind.ProposalExecuted: {
        this._data.queued = false;
        this._data.executed = true;
        this.complete(this._Gov.store);
        break;
      }
      default: {
        break;
      }
    }
  }

  public canVoteFrom(account: EthereumAccount) {
    // We need to check the delegate of account to perform voting checks. Delegates must
    // be fetched from chain, which requires async calls, making this impossible to implement.
    // TODO: load on contract init
    return true;
  }

  public async cancelTx() {
    if (this.data.cancelled) {
      throw new Error('proposal already cancelled');
    }

    // TODO: condition check for who can cancel

    const address = this._Gov.app.user.activeAccount.address;
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Contract);

    const gasLimit = await contract.estimateGas.cancel(this.data.identifier);
    const tx = await contract.cancel(
      this.data.identifier,
      { gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to cancel proposal');
    }
    return txReceipt;
  }

  public async queueTx() {
    if (this.data.queued || this.data.executed) {
      throw new Error('proposal already queued');
    }

    // TODO: condition check for who can queue

    const address = this._Gov.app.user.activeAccount.address;
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Contract);

    const gasLimit = await contract.estimateGas.queue(this.data.identifier);
    const tx = await contract.queue(
      this.data.identifier,
      { gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to queue proposal');
    }
    return txReceipt;
  }

  public async executeTx() {
    if (this.data.executed) {
      throw new Error('proposal already executed');
    }

    // TODO: condition check for who can execute

    const address = this._Gov.app.user.activeAccount.address;
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Contract);

    const gasLimit = await contract.estimateGas.execute(this.data.identifier);
    const tx = await contract.execute(
      this.data.identifier,
      { gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to execute proposal');
    }
    return txReceipt;
  }

  // web wallet TX only
  public async submitVoteWebTx(vote: CompoundProposalVote) {
    const address = vote.account.address;
    const contract = await attachSigner(
      this._Gov.app.wallets,
      address,
      this._Gov.api.Contract
    );
    if (!(await this._Chain.isDelegate(address))) {
      throw new Error('sender must be valid delegate');
    }

    if (this.state !== CompoundTypes.ProposalState.Active) {
      throw new Error('proposal not in active period');
    }

    const gasLimit = await contract.estimateGas.castVote(
      this.data.identifier,
      !!vote.choice
    );
    const tx = await contract.castVote(
      this.data.identifier,
      !!vote.choice,
      { gasLimit },
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
