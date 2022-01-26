import moment from 'moment';
import BN from 'bn.js';
import { capitalize } from 'lodash';
import { ContractTransaction, utils } from 'ethers';
import { GovernorCompatibilityBravo } from 'eth/types';

import { CompoundTypes } from '@commonwealth/chain-events';
import { ProposalType } from 'types';

import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';

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
import { blocknumToTime } from 'helpers';

import CompoundAPI, { GovernorType } from './api';
import CompoundGovernance from './governance';
import { attachSigner } from '../contractApi';
import EthereumAccount from '../account';
import EthereumAccounts from '../accounts';
import CompoundChain from './chain';

export enum BravoVote {
  NO = 0,
  YES = 1,
  ABSTAIN = 2,
}

export class CompoundProposalVote implements IVote<EthereumCoin> {
  public readonly account: EthereumAccount;
  public readonly choice: BravoVote;
  public readonly power: BN;

  constructor(member: EthereumAccount, choice: BravoVote, power?: BN) {
    this.account = member;
    this.choice = choice;
    this.power = power || new BN(0);
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
    expired: false,
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

  public get shortIdentifier() {
    return `${capitalize(this._Accounts?.app.activeChainId())}Proposal-${this.data.identifier}`;
  }
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
        return `Compound Proposal #${this.data.identifier}`;
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
        // TODO: voteSucceeded condition may not be simple majority (although it is on Alpha/Bravo)
        const isMajority = yesPower > noPower;
        const isQuorum = this.turnout >= 1;
        // TODO: should we omit quorum here for display purposes?
        return isMajority && isQuorum ? ProposalStatus.Passing : ProposalStatus.Failing;
      }
      default:
        // PENDING
        return ProposalStatus.None;
    }
  }

  public get author() { return this._Accounts.get(this.data.proposer); }

  public get votingType() {
    return this._Gov.supportsAbstain
      ? VotingType.CompoundYesNoAbstain : VotingType.CompoundYesNo;
  }
  public get votingUnit() { return VotingUnit.CoinVote; }

  public get startingPeriod() { return +this.data.startBlock; }
  public get votingPeriodEnd() { return this.startingPeriod + +this._Gov.votingPeriod; }

  public get state(): CompoundTypes.ProposalState {
    const time = Date.now() / 1000;
    if (this.data.cancelled) return CompoundTypes.ProposalState.Canceled;
    if (this.data.executed) return CompoundTypes.ProposalState.Executed;
    if (this.data.expired) return CompoundTypes.ProposalState.Expired;
    if (this.data.queued) return CompoundTypes.ProposalState.Queued;
    if (time <= blocknumToTime(this.data.startBlock).unix())
      return CompoundTypes.ProposalState.Pending;
    if (time <= blocknumToTime(this.data.endBlock).unix())
      return CompoundTypes.ProposalState.Active;

    const votes = this.getVotes();
    const yesPower = sumVotes(votes.filter((v) => v.choice === BravoVote.YES));
    const noPower = sumVotes(votes.filter((v) => v.choice === BravoVote.NO));
    const quorumPct = this.turnout;
    if (yesPower <= noPower || quorumPct < 1) {
      return CompoundTypes.ProposalState.Defeated;
    }
    if (!this.data.eta) return CompoundTypes.ProposalState.Succeeded;
    console.warn(`Invalid state for proposal: ${this}`);
    return null;
  }

  public get endTime(): ProposalEndTime {
    const state = this.state;

    // waiting to start
    if (state === CompoundTypes.ProposalState.Pending)
      return { kind: 'fixed_block', blocknum: this.data.startBlock };

    // started
    if (state === CompoundTypes.ProposalState.Active)
      return { kind: 'fixed_block', blocknum: this.data.endBlock };

    // queued but not ready for execution
    if (state === CompoundTypes.ProposalState.Queued && this.data.eta)
      return { kind: 'fixed', time: moment.unix(this.data.eta) };

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
    const yesPower = sumVotes(votes.filter((v) => v.choice === BravoVote.YES));
    const noPower = sumVotes(votes.filter((v) => v.choice === BravoVote.NO));
    if (yesPower.isZero() && noPower.isZero()) return 0;
    const supportBn = yesPower.muln(ONE_HUNDRED_WITH_PRECISION).div(yesPower.add(noPower));
    return +supportBn / ONE_HUNDRED_WITH_PRECISION;
  }

  // aka quorum, what % required turned out of required (can be >100%)
  public get turnout() {
    const votes = this.getVotes();
    const yesPower = sumVotes(votes.filter((v) => v.choice === BravoVote.YES));
    const abstainPower = sumVotes(votes.filter((v) => v.choice === BravoVote.ABSTAIN));
    const totalTurnout = this._Gov.useAbstainInQuorum ? yesPower.add(abstainPower) : yesPower;
    const requiredTurnout = this._Gov.quorumVotes.isZero() ? new BN(1) : this._Gov.quorumVotes;
    const pctRequiredTurnout = (
      +totalTurnout.muln(ONE_HUNDRED_WITH_PRECISION).div(requiredTurnout)
    ) / ONE_HUNDRED_WITH_PRECISION;
    return pctRequiredTurnout;
  }

  constructor(
    Accounts: EthereumAccounts,
    Chain: CompoundChain,
    Gov: CompoundGovernance,
    entity: ChainEntity,
  ) {
    // must set identifier before super() because of how response object is named
    super(ProposalType.CompoundProposal, backportEntityToAdapter(Gov, entity));

    this._Accounts = Accounts;
    this._Chain = Chain;
    this._Gov = Gov;

    entity.chainEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber).forEach((e) => this.update(e));

    this._Gov.store.add(this);
  }

  public async init() {
    // fetch state from chain to check for expired (no event emitted + no way to compute w/o timelock)
    const queriedState = await this._Gov.api.Contract.state(this.data.id);
    if (queriedState === CompoundTypes.ProposalState.Expired) {
      this.data.expired = true;
    }

    // also check queued, as Bravo/Oz may not emit queued events + fetch eta
    if (queriedState === CompoundTypes.ProposalState.Queued && !this.data.queued) {
      this.data.queued = true;
      if (this._Gov.api.govType === GovernorType.Bravo) {
        const p = await this._Gov.api.Contract.proposals(this.data.id);
        this.data.eta = +p.eta;
      } else if (this._Gov.api.govType === GovernorType.Oz) {
        try {
          const eta = await this._Gov.api.Contract.proposalEta(this.data.id);
          this.data.eta = +eta;
        } catch (e) {
          // we have no ETA because the proposal is not under a timelock
          // TODO: understand which sorts of Oz alternatives exist
        }
      }
    }

    this._initialized = true;

    // special case for expiration because no event is emitted
    if (
      this.state === CompoundTypes.ProposalState.Expired ||
      this.state === CompoundTypes.ProposalState.Defeated
    ) {
      this.complete(this._Gov.store);
    }
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
          e.data.support,
          power
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

    const address = this._Gov.app.user.activeAccount.address;
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Contract);

    let tx: ContractTransaction;
    if (this._Gov.api.govType === GovernorType.Oz) {
      const descriptionHash = utils.keccak256(
        utils.toUtf8Bytes(this.data.description)
      );
      const gasLimit = await (
        contract as GovernorCompatibilityBravo
      ).estimateGas['queue(address[],uint256[],bytes[],bytes32)'](
        this.data.targets,
        this.data.values,
        this.data.calldatas,
        descriptionHash
      );
      tx = await (
        contract as GovernorCompatibilityBravo
      )['queue(address[],uint256[],bytes[],bytes32)'](
        this.data.targets,
        this.data.values,
        this.data.calldatas,
        descriptionHash,
        { gasLimit }
      );
    } else {
      const gasLimit = await contract.estimateGas['queue(uint256)'](this.data.identifier);
      tx = await contract['queue(uint256)'](
        this.data.identifier,
        { gasLimit }
      );
    }
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

    const address = this._Gov.app.user.activeAccount.address;
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Contract);

    let tx: ContractTransaction;
    if (this._Gov.api.govType === GovernorType.Oz) {
      const descriptionHash = utils.keccak256(
        utils.toUtf8Bytes(this.data.description)
      );
      const gasLimit = await (
        contract as GovernorCompatibilityBravo
      ).estimateGas['execute(address[],uint256[],bytes[],bytes32)'](
        this.data.targets,
        this.data.values,
        this.data.calldatas,
        descriptionHash
      );
      tx = await (
        contract as GovernorCompatibilityBravo
      )['execute(address[],uint256[],bytes[],bytes32)'](
        this.data.targets,
        this.data.values,
        this.data.calldatas,
        descriptionHash,
        { gasLimit }
      );
    } else {
      const gasLimit = await contract.estimateGas['execute(uint256)'](this.data.identifier);
      tx = await contract['execute(uint256)'](
        this.data.identifier,
        { gasLimit }
      );
    }
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to execute proposal');
    }
    return txReceipt;
  }

  // web wallet TX only
  // TODO: support reason field
  public async submitVoteWebTx(vote: CompoundProposalVote) {
    const address = vote.account.address;
    const contract = await attachSigner(
      this._Gov.app.wallets,
      address,
      this._Gov.api.Contract,
    );
    // if (!(await this._Chain.isDelegate(address))) {
    //   throw new Error('sender must be valid delegate');
    // }
    if (!this._Gov.supportsAbstain && vote.choice === BravoVote.ABSTAIN) {
      throw new Error('Cannot vote abstain on governor alpha!');
    }
    if (this.state !== CompoundTypes.ProposalState.Active) {
      throw new Error('proposal not in active period');
    }

    let tx: ContractTransaction;
    if (this._Gov.api.isGovAlpha(contract)) {
      // convert voting to boolean for govalpha contract
      const voteBool = vote.choice === BravoVote.YES;
      const gasLimit = await contract.estimateGas.castVote(
        this.data.identifier,
        voteBool
      );
      tx = await contract.castVote(
        this.data.identifier,
        voteBool,
        { gasLimit },
      );
    } else {
      const gasLimit = await contract.estimateGas.castVote(
        this.data.identifier,
        +vote.choice
      );
      tx = await contract.castVote(
        this.data.identifier,
        +vote.choice,
        { gasLimit },
      );
    }
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
