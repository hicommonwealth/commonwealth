import moment from 'moment';
import BN from 'bn.js';

import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { IMarlinProposalResponse } from 'adapters/chain/marlin/types';

import { MarlinTypes } from '@commonwealth/chain-events';

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

import MarlinAPI from './api';
import MarlinGovernance from './governance';
import { attachSigner } from '../contractApi';
import EthereumAccount from '../account';
import EthereumAccounts from '../accounts';
import MarlinChain from './chain';

// eslint-disable-next-line no-shadow
export enum MarlinVote {
  YES = 1,
  NO = 0
}

export class MarlinProposalVote implements IVote<EthereumCoin> {
  public readonly account: EthereumAccount;
  public readonly choice: MarlinVote;
  public readonly power: BN;

  constructor(member: EthereumAccount, choice: MarlinVote, power?: BN) {
    this.account = member;
    this.choice = choice;
    this.power = power || new BN(0);
  }
}

const backportEntityToAdapter = (
  Gov: MarlinGovernance,
  entity: ChainEntity
): IMarlinProposalResponse => {
  const startEvent = entity.chainEvents.find((e) => e.data.kind === MarlinTypes.EventKind.ProposalCreated);
  const startData = startEvent.data as MarlinTypes.IProposalCreated;
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

function sumVotes(vs: MarlinProposalVote[]): BN {
  return vs.reduce((prev, curr) => {
    return prev.add(curr.power);
  }, new BN(0));
}

export default class MarlinProposal extends Proposal<
  MarlinAPI,
  EthereumCoin,
  IMarlinProposalResponse,
  MarlinProposalVote
> {
  private _Accounts: EthereumAccounts;
  private _Chain: MarlinChain;
  private _Gov: MarlinGovernance;

  public get shortIdentifier() { return `MarlinProposal-${this.data.identifier}`; }
  public get title(): string {
    return `Marlin Proposal #${this.data.identifier}`;
  }
  public get description(): string {
    return '';
  }

  public get isPassing(): ProposalStatus {
    switch (this.state) {
      case MarlinTypes.ProposalState.Canceled:
        return ProposalStatus.Canceled;
      case MarlinTypes.ProposalState.Succeeded:
      case MarlinTypes.ProposalState.Queued:
      case MarlinTypes.ProposalState.Executed:
        return ProposalStatus.Passed;
      case MarlinTypes.ProposalState.Expired:
      case MarlinTypes.ProposalState.Defeated:
        return ProposalStatus.Failed;
      case MarlinTypes.ProposalState.Active: {
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

  public get votingType() { return VotingType.MarlinYesNo; }
  public get votingUnit() { return VotingUnit.CoinVote; }

  public get startingPeriod() { return +this.data.startBlock; }
  public get votingPeriodEnd() { return this.startingPeriod + +this._Gov.votingPeriod; }

  public get state(): MarlinTypes.ProposalState {
    const blockNumber = this._Gov.app.chain.block.height;
    const blockTimestamp = this._Gov.app.chain.block.lastTime.unix();
    if (this.data.cancelled) return MarlinTypes.ProposalState.Canceled;
    if (blockNumber <= this.data.startBlock) return MarlinTypes.ProposalState.Pending;
    if (blockNumber <= this.data.endBlock) return MarlinTypes.ProposalState.Active;

    const votes = this.getVotes();
    const yesPower = sumVotes(votes.filter((v) => v.choice));
    const noPower = sumVotes(votes.filter((v) => !v.choice));
    if (yesPower <= noPower || yesPower <= this._Gov.quorumVotes)
      return MarlinTypes.ProposalState.Defeated;
    if (!this.data.eta) return MarlinTypes.ProposalState.Succeeded;
    if (this.data.executed) return MarlinTypes.ProposalState.Executed;
    if (blockTimestamp >= +this._Gov.gracePeriod.addn(this.data.eta))
      return MarlinTypes.ProposalState.Expired;
    return MarlinTypes.ProposalState.Queued;
  }

  public get endTime(): ProposalEndTime {
    const state = this.state;

    // waiting to start
    if (state === MarlinTypes.ProposalState.Pending) return { kind: 'fixed_block', blocknum: this.data.startBlock };

    // started
    if (state === MarlinTypes.ProposalState.Active) return { kind: 'fixed_block', blocknum: this.data.endBlock };

    // queued but not ready for execution
    if (state === MarlinTypes.ProposalState.Queued) return { kind: 'fixed', time: moment(this.data.eta) };

    // unavailable if: waiting to passed/failed but not in queue, or completed
    return { kind: 'unavailable' };
  }

  public get endBlock(): ProposalEndTime {
    return this.endTime;
  }

  public get isCancelled() {
    return this.data.cancelled;
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
    Chain: MarlinChain,
    Gov: MarlinGovernance,
    entity: ChainEntity,
  ) {
    // must set identifier before super() because of how response object is named
    super('marlinproposal', backportEntityToAdapter(Gov, entity));

    this._Accounts = Accounts;
    this._Chain = Chain;
    this._Gov = Gov;

    entity.chainEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber).forEach((e) => this.update(e));
    this._initialized = true;
    console.log(this);
    this._Gov.store.add(this);
  }

  public update(e: ChainEvent) {
    switch (e.data.kind) {
      case MarlinTypes.EventKind.ProposalCreated: {
        break;
      }
      case MarlinTypes.EventKind.VoteCast: {
        const power = new BN(e.data.votes);
        const vote = new MarlinProposalVote(
          this._Accounts.get(e.data.voter),
          e.data.support ? MarlinVote.YES : MarlinVote.NO,
          power,
        );
        this.addOrUpdateVote(vote);
        break;
      }
      case MarlinTypes.EventKind.ProposalCanceled: {
        this._data.cancelled = true;
        this._data.completed = true;
        this.complete(this._Gov.store);
        break;
      }
      case MarlinTypes.EventKind.ProposalQueued: {
        this._data.queued = true;
        this._data.eta = e.data.eta;
        break;
      }
      case MarlinTypes.EventKind.ProposalExecuted: {
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
    return true;
  }

  public async cancelTx() {
    if (this.isCancelled) {
      throw new Error('proposal already cancelled');
    }

    const address = this._Gov.app.user.activeAccount.address;
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Contract);

    const tx = await contract.cancel(
      this.data.identifier,
      { gasLimit: this._Gov.api.gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to cancelled proposal');
    }
    return txReceipt;
  }

  // web wallet TX only
  public async submitVoteWebTx(vote: MarlinProposalVote) {
    const address = vote.account.address;
    const contract = await attachSigner(
      this._Gov.app.wallets,
      address,
      this._Gov.api.Contract
    );
    if (!(await this._Chain.isDelegate(address))) {
      throw new Error('sender must be valid delegate');
    }

    if (this.state !== MarlinTypes.ProposalState.Active) {
      throw new Error('proposal not in active period');
    }

    const tx = await contract.castVote(
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
