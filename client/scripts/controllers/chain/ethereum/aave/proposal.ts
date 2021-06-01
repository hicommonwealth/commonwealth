import moment from 'moment';
import BN from 'bn.js';

import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';

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

  constructor(member: EthereumAccount, choice: boolean, power: BN) {
    this.account = member;
    this.choice = choice;
    this.power = power;
  }
}

const backportEntityToAdapter = (entity: ChainEntity): IAaveProposalResponse => {
  const startEvent = entity.chainEvents.find((e) => e.data.kind === AaveTypes.EventKind.ProposalCreated);
  const startData = startEvent.data as AaveTypes.IProposalCreated;
  delete startData.kind;
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

  public get votingType() { return VotingType.SimpleYesNoVoting; }
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

  private _forVotes: BN;
  private _againstVotes: BN;
  public get forVotes() { return this._forVotes; }
  public get againstVotes() { return this._againstVotes; }

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
        this._forVotes = e.data.forVotes ? new BN(e.data.forVotes) : new BN(0);
        this._againstVotes = e.data.againstVotes ? new BN(e.data.forVotes) : new BN(0);
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

  public addOrUpdateVote(vote: AaveProposalVote) {
    super.addOrUpdateVote(vote);

    // maintain global power state
    if (vote.choice) {
      this._forVotes.add(vote.power);
    } else {
      this._againstVotes.add(vote.power);
    }
  }

  public canVoteFrom(account: EthereumAccount) {
    // TODO
    // We need to check the delegate of account to perform voting checks. Delegates must
    // be fetched from chain, which requires async calls, making this impossible to implement.
    return true;
  }

  public async castVote(support: boolean) {
    const address = this._Gov.app.user.activeAccount.address;
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Governance);

    // TODO: validate

    const tx = await contract.castVote(this.data.id, support);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to cast vote on proposal #${this.data.id}`);
    }
  }

  public async cancelTx() {
    if (this.data.cancelled) {
      throw new Error('proposal already canceled');
    }

    const address = this._Gov.app.user.activeAccount.address;
    const contract = await attachSigner(this._Gov.app.wallets, address, this._Gov.api.Governance);

    // TODO: validate

    const tx = await contract.cancel(
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
  public async submitVoteWebTx(vote: AaveProposalVote) {
    const address = vote.account.address;
    const contract = await attachSigner(
      this._Gov.app.wallets,
      address,
      this._Gov.api.Governance
    );

    // TODO: validate

    if (await this.state() !== AaveTypes.ProposalState.ACTIVE) {
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
