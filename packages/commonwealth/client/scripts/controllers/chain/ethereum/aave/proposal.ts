/* eslint-disable @typescript-eslint/no-unused-vars */
import { ProposalType } from '@hicommonwealth/core';
import type {
  IAaveProposalResponse,
  IAaveVoteResponse,
} from 'adapters/chain/aave/types';
import type { EthereumCoin } from 'adapters/chain/ethereum/types';
import { formatNumberLong } from 'adapters/currency';
import BN from 'bn.js';
import bs58 from 'bs58';
import { EventEmitter } from 'events';
import { blocknumToTime } from 'helpers';
import $ from 'jquery';
import moment from 'moment';
import Web3 from 'web3-utils';
import { ProposalState } from '../../../../../../shared/chain/types/aave';
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
import Aave from 'controllers/chain/ethereum/aave/adapter';
import { ApiEndpoints } from 'state/api/config';
import type AaveAPI from './api';
import type AaveGovernance from './governance';

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
    return `${formatNumberLong(+Web3.fromWei(this.power.toString()))} ${
      this.account.community.default_symbol
    }`;
  }
}

const ONE_HUNDRED_WITH_PRECISION = 10000;

interface AipIpfsObject {
  aip: number;
  title: string;
  status: string;
  author: string;
  shortDescription: string;
  discussions: string;
  created: string;
  preview: string;
  basename: string;
  description: string;
  updated: string;
}

export default class AaveProposal extends Proposal<
  AaveAPI,
  EthereumCoin,
  IAaveProposalResponse,
  AaveProposalVote
> {
  private _Accounts: EthereumAccounts;
  private _Gov: AaveGovernance;

  public ipfsDataReady = new EventEmitter();

  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }

  public get title(): string {
    return this._ipfsData?.title || `Proposal #${this.data.identifier}`;
  }

  public get description(): string {
    return this._ipfsData?.description || '';
  }

  public get isPassing(): ProposalStatus {
    switch (this.state) {
      case ProposalState.CANCELED:
        return ProposalStatus.Canceled;
      case ProposalState.SUCCEEDED:
      case ProposalState.QUEUED:
      case ProposalState.EXECUTED:
        return ProposalStatus.Passed;
      case ProposalState.EXPIRED:
      case ProposalState.FAILED:
        return ProposalStatus.Failed;
      case ProposalState.ACTIVE:
        return this._isPassed()
          ? ProposalStatus.Passing
          : ProposalStatus.Failing;
      default:
        // PENDING
        return ProposalStatus.None;
    }
  }

  public get author() {
    return this._Accounts.get(this.data.proposer);
  }

  public get votingType() {
    return VotingType.ConvictionYesNoVoting;
  }

  public get votingUnit() {
    return VotingUnit.PowerVote;
  }

  public get state(): ProposalState {
    const currentTime = Date.now() / 1000;
    if (this.data.cancelled) return ProposalState.CANCELED;
    if (currentTime <= blocknumToTime(this.data.startBlock).unix())
      return ProposalState.PENDING;
    if (currentTime <= blocknumToTime(this.data.endBlock).unix())
      return ProposalState.ACTIVE;
    if (this._isPassed() === false) return ProposalState.FAILED;
    if (!this.data.executionTime && !this.data.queued)
      return ProposalState.SUCCEEDED;
    if (this.data.executed) return ProposalState.EXECUTED;
    if (currentTime > +this.data.executionTimeWithGracePeriod)
      return ProposalState.EXPIRED;
    if (this.data.queued) return ProposalState.QUEUED;
    return null;
  }

  public get startBlock() {
    return this.data.startBlock;
  }

  public get endTime(): ProposalEndTime {
    const state = this.state;

    // waiting to start
    if (state === ProposalState.PENDING)
      return { kind: 'fixed_block', blocknum: this.data.startBlock };

    // started
    if (state === ProposalState.ACTIVE)
      return { kind: 'fixed_block', blocknum: this.data.endBlock };

    // queued but not ready for execution
    if (state === ProposalState.QUEUED)
      return { kind: 'fixed', time: moment.unix(this.data.executionTime) };

    // unavailable if: waiting to passed/failed but not in queue, or completed
    return { kind: 'unavailable' };
  }

  // TODO: handle pending but not yet ready for voting
  public get endBlock(): ProposalEndTime {
    return this.endTime;
  }

  public get support() {
    if (this.data.forVotes.isZero() && this.data.againstVotes.isZero())
      return 0;
    const result = this.data.forVotes
      .mul(ONE_HUNDRED_WITH_PRECISION)
      .div(this.data.forVotes.add(this.data.againstVotes));
    return +result / ONE_HUNDRED_WITH_PRECISION;
  }

  public get turnout() {
    const totalPowerVoted = this.data.forVotes.add(this.data.againstVotes);
    const result = totalPowerVoted
      .mul(ONE_HUNDRED_WITH_PRECISION)
      .div(this.votingSupplyAtStart);
    return +result / ONE_HUNDRED_WITH_PRECISION;
  }

  // (FOR VOTES - AGAINST VOTES) / voting supply
  public get voteDifferential() {
    const forProp = this.data.forVotes
      .mul(ONE_HUNDRED_WITH_PRECISION)
      .div(this.votingSupplyAtStart);
    const againstProp = this.data.againstVotes
      .mul(ONE_HUNDRED_WITH_PRECISION)
      .div(this.votingSupplyAtStart);
    return (+forProp - +againstProp) / ONE_HUNDRED_WITH_PRECISION;
  }

  public get minimumQuorum() {
    return +this.data.minimumQuorum / ONE_HUNDRED_WITH_PRECISION;
  }

  public get minimumVoteDifferential() {
    return +this.data.minimumDiff / ONE_HUNDRED_WITH_PRECISION;
  }

  public get votingSupplyAtStart() {
    return this.data.votingSupplyAtStart;
  }

  private _ipfsAddress: string;
  private _ipfsData: AipIpfsObject;
  public get ipfsData() {
    return this._ipfsData;
  }

  // Check whether a proposal has enough extra FOR-votes than AGAINST-votes
  // FOR VOTES - AGAINST VOTES > VOTE_DIFFERENTIAL * voting supply
  private _isVoteDifferentialPassing() {
    const forProp = this.data.forVotes
      .mul(ONE_HUNDRED_WITH_PRECISION)
      .div(this.votingSupplyAtStart);
    const againstProp = this.data.againstVotes
      .mul(ONE_HUNDRED_WITH_PRECISION)
      .div(this.votingSupplyAtStart)
      .add(this.data.minimumDiff);
    return forProp.gt(againstProp);
  }

  private _isQuorumValid() {
    return this.data.forVotes.gte(this.data.minimumQuorum);
  }

  private _isPassed() {
    if (!this._initialized) {
      return null;
    }
    return this._isVoteDifferentialPassing() && this._isQuorumValid();
  }

  public async init() {
    // fetch IPFS information
    $.get(`${this._Gov.app.serverUrl()}/ipfsProxy?hash=${this._ipfsAddress}`)
      .then((ipfsData) => {
        if (typeof ipfsData === 'string') {
          this._ipfsData = JSON.parse(ipfsData);
        } else if (typeof ipfsData === 'object') {
          this._ipfsData = ipfsData;
        } else {
          throw new Error('Invalid IPFS data format');
        }
        this.ipfsDataReady.emit('ready');
      })
      .catch(() =>
        console.error(`Failed to fetch ipfs data for ${this._ipfsAddress}`),
      );

    this._initialized = true;
  }

  static async fetchVotes(proposalId: number, aaveChain: Aave) {
    const { chain, accounts, governance, meta } = aaveChain;
    const res = await axios.get(
      `${chain.app.serverUrl()}${ApiEndpoints.FETCH_PROPOSAL_VOTES}`,
      {
        params: {
          communityId: meta.id,
          proposalId: proposalId,
        },
      },
    );

    const votes: IAaveVoteResponse[] = res.data.result.votes;

    const proposalInstance = governance.store.getByIdentifier(proposalId);
    if (!proposalInstance) {
      console.error(`Proposal ${proposalId} not found`);
    }

    for (const vote of votes) {
      const power = new BN(vote.votingPower);
      const aaveVote = new AaveProposalVote(
        accounts.get(vote.voter),
        vote.support,
        power,
      );
      proposalInstance.addOrUpdateVote(aaveVote);
    }

    return proposalInstance.getVotes();
  }

  constructor(
    Accounts: EthereumAccounts,
    Gov: AaveGovernance,
    data: IAaveProposalResponse,
  ) {
    super(ProposalType.AaveProposal, data);
    this._completed = data.completed;

    this._Accounts = Accounts;
    this._Gov = Gov;

    this._Gov.store.add(this);
    // insert Qm prefix via hex
    this._ipfsAddress = bs58.encode(
      Buffer.from(`1220${this.data.ipfsHash.slice(2)}`, 'hex'),
    );
  }

  public update(e: ChainEvent) {
    console.error("AaveProposal doesn't support update");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canVoteFrom(account: EthereumAccount) {
    // TODO
    // We need to check the delegate of account to perform voting checks. Delegates must
    // be fetched from chain, which requires async calls, making this impossible to implement.
    return true;
  }

  public get isCancellable() {
    return !(
      this.state === ProposalState.CANCELED ||
      this.state === ProposalState.FAILED ||
      this.state === ProposalState.EXECUTED ||
      this.state === ProposalState.EXPIRED
    );
  }

  public get isQueueable() {
    return this.state === ProposalState.SUCCEEDED;
  }

  public async cancelTx() {
    if (this.data.cancelled) {
      throw new Error('proposal already canceled');
    }

    // validate proposal state
    if (!this.isCancellable) {
      throw new Error('Proposal not in cancelable state');
    }

    // the guardian can always cancel, but any user can cancel if creator has lost
    // sufficient proposition power
    const executor = await this._Gov.api.getDeployedExecutor(
      this.data.executor,
    );
    if (!executor) {
      throw new Error('executor not found');
    }
    const blockNumber = await this._Gov.api.Provider.getBlockNumber();
    const isCancellable = await executor.validateProposalCancellation(
      this._Gov.api.Governance.address,
      this.data.proposer,
      blockNumber - 1,
    );
    if (!isCancellable) {
      const guardian = await this._Gov.api.Governance.getGuardian();
      if (this._Gov.app.user.activeAccount.address !== guardian) {
        throw new Error('proposal cannot be cancelled');
      }
    }

    const contract = await attachSigner(
      this._Gov.app.user.activeAccount,
      this._Gov.api.Governance,
    );
    const tx = await contract.cancel(this.data.identifier, {
      gasLimit: this._Gov.api.gasLimit,
    });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to cancel proposal');
    }
    return txReceipt;
  }

  public async queueTx() {
    // validate proposal state
    if (this.state !== ProposalState.SUCCEEDED) {
      throw new Error('Proposal not in succeeded state');
    }

    // no user validation needed
    const contract = await attachSigner(
      this._Gov.app.user.activeAccount,
      this._Gov.api.Governance,
    );
    const tx = await contract.queue(this.data.id);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to submit vote on proposal #${this.data.id}`);
    }
  }

  public get isExecutable() {
    // will be EXPIRED if over grace period
    return (
      this.state === ProposalState.QUEUED &&
      this.data.executionTime &&
      this.data.executionTime <= this._Gov.app.chain.block.lastTime.unix()
    );
  }

  public async executeTx() {
    if (!this.isExecutable) {
      throw new Error('proposal not in executable state');
    }

    // no user validation needed
    const contract = await attachSigner(
      this._Gov.app.user.activeAccount,
      this._Gov.api.Governance,
    );
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
    if (this.state !== ProposalState.ACTIVE) {
      throw new Error('Proposal not in active state');
    }

    // ensure user hasn't voted
    const previousVote = await this._Gov.api.Governance.getVoteOnProposal(
      this.data.id,
      address,
    );
    if (previousVote && !previousVote.votingPower.isZero()) {
      throw new Error('user has already voted on this proposal');
    }

    const contract = await attachSigner(
      this._Gov.app.user.activeAccount,
      this._Gov.api.Governance,
    );
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
