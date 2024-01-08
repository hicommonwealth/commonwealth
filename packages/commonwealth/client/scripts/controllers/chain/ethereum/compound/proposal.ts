/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  ICompoundProposalResponse,
  ICompoundVoteResponse,
} from 'adapters/chain/compound/types';

import type { EthereumCoin } from 'adapters/chain/ethereum/types';
import BN from 'bn.js';

import type { GovernorCompatibilityBravo } from '@hicommonwealth/chains';
import { GovernorMock__factory } from '@hicommonwealth/chains';
import { ProposalType } from '@hicommonwealth/core';
import type { ContractTransaction } from 'ethers';
import { BigNumber, utils } from 'ethers';

import moment from 'moment';
import type ChainEvent from '../../../../models/ChainEvent';
import Proposal from '../../../../models/Proposal';
import type { ITXModalData, IVote } from '../../../../models/interfaces';
import type { ProposalEndTime } from '../../../../models/types';
import {
  ProposalStatus,
  VotingType,
  VotingUnit,
} from '../../../../models/types';
import type EthereumAccount from '../account';
import type EthereumAccounts from '../accounts';
import { attachSigner } from '../contractApi';

import axios from 'axios';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import { ApiEndpoints } from 'state/api/config';
import {
  EventKind,
  ProposalState,
} from '../../../../../../shared/chain/types/compound';
import type CompoundAPI from './api';
import { GovernorType } from './api';
import type CompoundChain from './chain';
import type CompoundGovernance from './governance';

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
    return `#${this.data.identifier}`;
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
    return (
      this.state === ProposalState.Queued &&
      this.data.eta &&
      this.data.eta <= this._Gov.app.chain.block.lastTime.unix()
    );
  }

  public get isPassing(): ProposalStatus {
    switch (this.state) {
      case ProposalState.Canceled:
        return ProposalStatus.Canceled;
      case ProposalState.Succeeded:
      case ProposalState.Queued:
      case ProposalState.Executed:
        return ProposalStatus.Passed;
      case ProposalState.Expired:
      case ProposalState.Defeated:
        return ProposalStatus.Failed;
      case ProposalState.Active: {
        const yesPower = this.data.forVotes;
        const noPower = this.data.againstVotes;
        // TODO: voteSucceeded condition may not be simple majority (although it is on Alpha/Bravo)
        const isMajority = yesPower.gt(noPower);
        const isQuorum = this.turnout >= 1;
        // TODO: should we omit quorum here for display purposes?
        return isMajority && isQuorum
          ? ProposalStatus.Passing
          : ProposalStatus.Failing;
      }
      default:
        // PENDING
        return ProposalStatus.None;
    }
  }

  public get author() {
    return this._Accounts.get(this.data.proposer);
  }

  public get votingType() {
    return this._Gov.supportsAbstain
      ? VotingType.CompoundYesNoAbstain
      : VotingType.CompoundYesNo;
  }

  public get votingUnit() {
    return VotingUnit.CoinVote;
  }

  public get startingPeriod() {
    return +this.data.startBlock;
  }

  public get state(): ProposalState {
    return this.data.state;
  }

  public get endTime(): ProposalEndTime {
    const state = this.state;

    // waiting to start
    if (state === ProposalState.Pending)
      return { kind: 'fixed_block', blocknum: this.data.startBlock };

    // started
    if (state === ProposalState.Active)
      return { kind: 'fixed_block', blocknum: this.data.endBlock };

    // queued but not ready for execution
    if (state === ProposalState.Queued && this.data.eta)
      return { kind: 'fixed', time: moment.unix(this.data.eta) };

    // unavailable if: waiting to passed/failed but not in queue, or completed
    return { kind: 'unavailable' };
  }

  public get endBlock(): ProposalEndTime {
    return this.endTime;
  }

  public get isCancelled() {
    return this.data.state === ProposalState.Canceled;
  }

  public get isQueueable() {
    return this.state === ProposalState.Succeeded;
  }

  public get queued() {
    return this.state === ProposalState.Queued;
  }

  public get executed() {
    return this.state === ProposalState.Executed;
  }

  public get support() {
    if (this.data.forVotes.isZero() && this.data.againstVotes.isZero()) {
      return 0;
    }
    const supportBn = this.data.forVotes
      .mul(ONE_HUNDRED_WITH_PRECISION)
      .div(this.data.forVotes.add(this.data.againstVotes));

    return +supportBn / ONE_HUNDRED_WITH_PRECISION;
  }

  // aka quorum, what % required turned out of required (can be >100%)
  public get turnout() {
    const yesPower = this.data.forVotes;
    const abstainPower = this.data.abstainVotes;
    const totalTurnout = this._Gov.useAbstainInQuorum
      ? yesPower.add(abstainPower)
      : yesPower;
    const requiredTurnout = this._Gov.quorumVotes.isZero()
      ? BigNumber.from(1)
      : this._Gov.quorumVotes;
    const pctRequiredTurnout =
      +totalTurnout.mul(ONE_HUNDRED_WITH_PRECISION).div(requiredTurnout) /
      ONE_HUNDRED_WITH_PRECISION;
    return pctRequiredTurnout;
  }

  constructor(
    Accounts: EthereumAccounts,
    Chain: CompoundChain,
    Gov: CompoundGovernance,
    data: ICompoundProposalResponse,
  ) {
    // must set identifier before super() because of how response object is named
    super(ProposalType.CompoundProposal, data);

    this._Accounts = Accounts;
    this._Chain = Chain;
    this._Gov = Gov;

    this._completed = this.data.completed;
    this._initialized = true;
    this._Gov.store.add(this);
  }

  static async fetchVotes(
    proposalId: string,
    proposalIdentifier: string,
    compoundChain: Compound,
  ) {
    const { chain, accounts, governance, meta } = compoundChain;

    const proposalInstance =
      governance.store.getByIdentifier(proposalIdentifier);
    if (!proposalInstance) {
      throw new Error(`Proposal ${proposalIdentifier} not found`);
    }

    const res = await axios.get(
      `${chain.app.serverUrl()}${ApiEndpoints.FETCH_PROPOSAL_VOTES}`,
      {
        params: {
          chainId: meta.id,
          proposalId,
        },
      },
    );

    const votes: ICompoundVoteResponse[] = res.data.result.votes;

    for (const vote of votes) {
      const power = new BN(vote.votes);
      const compoundVote = new CompoundProposalVote(
        accounts.get(vote.voter),
        vote.support,
        power,
      );
      proposalInstance.addOrUpdateVote(compoundVote);
    }

    return proposalInstance.getVotes();
  }

  public update(e: ChainEvent) {
    switch (e.data.kind) {
      case EventKind.ProposalCreated: {
        break;
      }
      case EventKind.VoteCast: {
        const power = new BN(e.data.votes);
        const vote = new CompoundProposalVote(
          this._Accounts.get(e.data.voter),
          e.data.support,
          power,
        );
        this.addOrUpdateVote(vote);
        break;
      }
      default: {
        break;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canVoteFrom(account: EthereumAccount) {
    // We need to check the delegate of account to perform voting checks. Delegates must
    // be fetched from chain, which requires async calls, making this impossible to implement.
    // TODO: load on contract init
    return true;
  }

  public async cancelTx() {
    if (this.data.state === ProposalState.Canceled) {
      throw new Error('proposal already cancelled');
    }

    let tx: ContractTransaction;
    const contract = await attachSigner(
      this._Gov.app.user.activeAccount,
      this._Gov.api.Contract,
    );
    try {
      const gasLimit = await contract.estimateGas['cancel(uint256)'](
        this.data.identifier,
      );
      tx = await contract['cancel(uint256)'](this.data.identifier, {
        gasLimit,
      });
    } catch (e) {
      // workaround for Oz without BravoCompatLayer
      // uses GovernorMock because it supports the proper cancel ABI vs BravoCompat
      const contractNoSigner = GovernorMock__factory.connect(
        this._Gov.api.contractAddress,
        this._Gov.api.Provider,
      );
      const ozContract = await attachSigner(
        this._Gov.app.user.activeAccount,
        contractNoSigner,
      );
      const descriptionHash = utils.keccak256(
        utils.toUtf8Bytes(this.data.description),
      );
      try {
        const gasLimit = await ozContract.estimateGas.cancel(
          this.data.targets,
          this.data.values,
          this.data.calldatas,
          descriptionHash,
        );
        tx = await ozContract.cancel(
          this.data.targets,
          this.data.values,
          this.data.calldatas,
          descriptionHash,
          { gasLimit },
        );
      } catch (eInner) {
        // both errored out -- fail
        console.error(eInner.message);
        throw eInner;
      }
    }
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to cancel proposal');
    }
    return txReceipt;
  }

  public async queueTx() {
    if (
      this.data.state === ProposalState.Queued ||
      this.data.state === ProposalState.Executed
    ) {
      throw new Error('proposal already queued');
    }

    const contract = await attachSigner(
      this._Gov.app.user.activeAccount,
      this._Gov.api.Contract,
    );

    let tx: ContractTransaction;
    if (this._Gov.api.govType === GovernorType.Oz) {
      const descriptionHash = utils.keccak256(
        utils.toUtf8Bytes(this.data.description),
      );
      const gasLimit = await (
        contract as GovernorCompatibilityBravo
      ).estimateGas['queue(address[],uint256[],bytes[],bytes32)'](
        this.data.targets,
        this.data.values,
        this.data.calldatas,
        descriptionHash,
      );
      tx = await (contract as GovernorCompatibilityBravo)[
        'queue(address[],uint256[],bytes[],bytes32)'
      ](
        this.data.targets,
        this.data.values,
        this.data.calldatas,
        descriptionHash,
        { gasLimit },
      );
    } else {
      const gasLimit = await contract.estimateGas['queue(uint256)'](
        this.data.identifier,
      );
      tx = await contract['queue(uint256)'](this.data.identifier, { gasLimit });
    }
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to queue proposal');
    }
    return txReceipt;
  }

  public async executeTx() {
    if (this.data.state === ProposalState.Executed) {
      throw new Error('proposal already executed');
    }

    const contract = await attachSigner(
      this._Gov.app.user.activeAccount,
      this._Gov.api.Contract,
    );

    let tx: ContractTransaction;
    if (this._Gov.api.govType === GovernorType.Oz) {
      const descriptionHash = utils.keccak256(
        utils.toUtf8Bytes(this.data.description),
      );
      const gasLimit = await (
        contract as GovernorCompatibilityBravo
      ).estimateGas['execute(address[],uint256[],bytes[],bytes32)'](
        this.data.targets,
        this.data.values,
        this.data.calldatas,
        descriptionHash,
      );
      tx = await (contract as GovernorCompatibilityBravo)[
        'execute(address[],uint256[],bytes[],bytes32)'
      ](
        this.data.targets,
        this.data.values,
        this.data.calldatas,
        descriptionHash,
        { gasLimit },
      );
    } else {
      const gasLimit = await contract.estimateGas['execute(uint256)'](
        this.data.identifier,
      );
      tx = await contract['execute(uint256)'](this.data.identifier, {
        gasLimit,
      });
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
    const contract = await attachSigner(vote.account, this._Gov.api.Contract);
    if (!(await this._Chain.isDelegate(address, this.data.startBlock))) {
      throw new Error('Must have voting balance at proposal start');
    }
    if (!this._Gov.supportsAbstain && vote.choice === BravoVote.ABSTAIN) {
      throw new Error('Cannot vote abstain on governor alpha!');
    }
    if (this.state !== ProposalState.Active) {
      throw new Error('proposal not in active period');
    }

    let tx: ContractTransaction;
    if (this._Gov.api.isGovAlpha(contract)) {
      // convert voting to boolean for govalpha contract
      const voteBool = vote.choice === BravoVote.YES;
      const gasLimit = await contract.estimateGas.castVote(
        this.data.identifier,
        voteBool,
      );
      tx = await contract.castVote(this.data.identifier, voteBool, {
        gasLimit,
      });
    } else {
      const gasLimit = await contract.estimateGas.castVote(
        this.data.identifier,
        +vote.choice,
      );
      tx = await contract.castVote(this.data.identifier, +vote.choice, {
        gasLimit,
      });
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
