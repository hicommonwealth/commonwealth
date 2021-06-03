import moment from 'moment';
import BN from 'bn.js';
import Web3 from 'web3';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { formatNumberLong } from 'adapters/currency';
import { AaveTypes } from '@commonwealth/chain-events';

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

import AaveAPI from './api';
import AaveGovernance from './governance';
import { attachSigner } from '../contractApi';
import AaveChain from './chain';
import EthereumAccounts from '../accounts';
import EthereumAccount from '../account';

export class AaveProposalVote implements IVote<EthereumCoin> {
  public readonly account: EthereumAccount;
  public readonly choice: boolean;
  public readonly power: BN;

  constructor(member: EthereumAccount, choice: boolean, power?: BN) {
    this.account = member;
    this.choice = choice;
    this.power = power || new BN(0);
  }

  public format(): string {
    return `${formatNumberLong(+Web3.utils.fromWei(this.power))} POWER`;
  }
}

const backportEntityToAdapter = (entity: ChainEntity): IAaveProposalResponse => {
  const startEvent = entity.chainEvents.find((e) => e.data.kind === AaveTypes.EventKind.ProposalCreated);
  if (!startEvent) {
    console.log(entity);
    console.log(entity.chainEvents);
    console.log(entity.chainEvents.map((e) => e.data.kind));
    console.log(AaveTypes.EventKind.ProposalCreated);
  }
  const startData = startEvent.data as AaveTypes.IProposalCreated;
  return {
    identifier: `${startData.id}`,
    queued: false,
    executed: false,
    cancelled: false,
    completed: false,
    ...startData,
  };
};

export default class AaveProposal extends Proposal<
  AaveAPI,
  EthereumCoin,
  IAaveProposalResponse,
  AaveProposalVote
> {
  private _Chain: AaveChain;
  private _Accounts: EthereumAccounts;
  private _Gov: AaveGovernance;

  public get shortIdentifier() { return `AaveProposal-${this.data.identifier}`; }
  public get title(): string {
    return `Aave Proposal #${this.data.identifier}`;
  }
  public get description(): string {
    // TODO: populate from values/calldatas/etc
    return '';
  }

  public get isPassing(): ProposalStatus {
    // TODO
    return ProposalStatus.Passing;
  }

  public get author() { return this._Accounts.get(this.data.proposer); }

  public get votingType() { return VotingType.ConvictionYesNoVoting; }
  public get votingUnit() { return VotingUnit.PowerVote; }

  public async state(): Promise<AaveTypes.ProposalState> {
    const state = await this._Gov.api.Governance.state(this.data.id);
    if (state === null) {
      throw new Error(`Failed to get state for proposal #${this.data.id}`);
    }
    return state;
  }

  public get startBlock() { return this.data.startBlock; }

  public get endTime(): ProposalEndTime { // TODO: Get current block and subtract from endBlock * 15s
    return { kind: 'fixed', time: moment.unix(this.data.endBlock) };
  }

  public get endBlock(): ProposalEndTime {
    if (!this.data.endBlock) return { kind: 'unavailable' };
    if (this.data.executionTime) return { kind: 'fixed', time: moment(this.data.executionTime) };
    return { kind: 'fixed_block', blocknum: this.data.endBlock };
  }

  public get support() {
    // TODO
    return 0;
  }

  public get turnout() {
    // TODO
    return null;
  }

  constructor(
    Chain: AaveChain,
    Accounts: EthereumAccounts,
    Gov: AaveGovernance,
    entity: ChainEntity,
  ) {
    // must set identifier before super() because of how response object is named
    super('aaveproposal', backportEntityToAdapter(entity));

    this._Chain = Chain;
    this._Accounts = Accounts;
    this._Gov = Gov;

    entity.chainEvents.sort((e1, e2) => e1.blockNumber - e2.blockNumber).forEach((e) => this.update(e));

    this._initialized = true;
    this._Gov.store.add(this);
  }

  public update(e: ChainEvent) {
    switch (e.data.kind) {
      case AaveTypes.EventKind.ProposalCreated: {
        break;
      }
      case AaveTypes.EventKind.VoteEmitted: {
        const power = new BN(e.data.votingPower);
        const vote = new AaveProposalVote(
          this._Accounts.get(e.data.voter),
          e.data.support,
          power,
        );
        this.addOrUpdateVote(vote);
        break;
      }
      case AaveTypes.EventKind.ProposalCanceled: {
        this._data.cancelled = true;
        this._data.completed = true;
        this.complete(this._Gov.store);
        break;
      }
      case AaveTypes.EventKind.ProposalQueued: {
        this._data.queued = true;
        this._data.executionTime = e.data.executionTime;
        break;
      }
      case AaveTypes.EventKind.ProposalExecuted: {
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
    // TODO
    // We need to check the delegate of account to perform voting checks. Delegates must
    // be fetched from chain, which requires async calls, making this impossible to implement.
    return true;
  }

  public async cancelTx() {
    if (this.data.cancelled) {
      throw new Error('proposal already canceled');
    }

    const address = this._Gov.app.user.activeAccount.address;

    // validate proposal state
    const state = await this.state();
    if (state === AaveTypes.ProposalState.CANCELED
      || state === AaveTypes.ProposalState.EXECUTED
      || state === AaveTypes.ProposalState.EXPIRED
    ) {
      throw new Error('Proposal not in cancelable state');
    }

    // the guardian can always cancel, but any user can cancel if creator has lost
    // sufficient proposition power
    const executor = this._Gov.api.getExecutor(this.data.executor);
    if (!executor) {
      throw new Error('executor not found');
    }
    const isCancellable = await executor.validateProposalCancellation(
      this._Gov.api.Governance.address,
      this.data.proposer,
      this._Gov.app.chain.block.height - 1,
    );
    if (!isCancellable) {
      const guardian = await this._Gov.api.Governance.getGuardian();
      if (address !== guardian) {
        throw new Error('proposal cannot be cancelled');
      }
    }

    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Governance);
    const tx = await contract.cancel(
      this.data.identifier,
      { gasLimit: this._Gov.api.gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to cancel proposal');
    }
    return txReceipt;
  }

  public async queueTx() {
    const address = this._Gov.app.user.activeAccount.address;

    // validate proposal state
    if (await this.state() !== AaveTypes.ProposalState.SUCCEEDED) {
      throw new Error('Proposal not in succeeded state');
    }

    // no user validation needed
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Governance);
    const tx = await contract.queue(this.data.id);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to submit vote on proposal #${this.data.id}`);
    }
  }

  public async executeTx() {
    const address = this._Gov.app.user.activeAccount.address;

    // validate proposal state (will be expired if over grace period)
    if (await this.state() !== AaveTypes.ProposalState.QUEUED) {
      throw new Error('Proposal not in queued state');
    }

    // validate proposal queue
    const executionTime = this.data.executionTime;
    if (!executionTime) {
      throw new Error('no execution time found');
    }
    const timestamp = this._Gov.app.chain.block.lastTime.unix();
    if (timestamp >= executionTime) {
      throw new Error('proposal not ready for execution');
    }

    // no user validation needed
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Governance);
    const tx = await contract.execute(this.data.id);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to submit vote on proposal #${this.data.id}`);
    }
  }

  // web wallet TX only
  public async submitVoteWebTx(vote: AaveProposalVote) {
    const address = this._Gov.app.user.activeAccount.address;

    // validate proposal state
    if (await this.state() !== AaveTypes.ProposalState.ACTIVE) {
      throw new Error('Proposal not in active state');
    }

    // ensure user hasn't voted
    const previousVote = await this._Gov.api.Governance.getVoteOnProposal(this.data.id, address);
    if (previousVote && !previousVote.votingPower.isZero()) {
      throw new Error('user has already voted on this proposal');
    }

    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Governance);
    const tx = await contract.submitVote(this.data.id, vote.choice);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to submit vote on proposal #${this.data.id}`);
    }
  }

  public submitVoteTx(): ITXModalData {
    throw new Error('not implemented');
  }
}
