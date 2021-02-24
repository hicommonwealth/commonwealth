import _ from 'underscore';
import { SubstrateTypes } from '@commonwealth/chain-events';
import { VoteOutcome, VoteRecord } from '@edgeware/node-types';
import { ApiPromise } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { IEdgewareSignalingProposal } from 'adapters/chain/edgeware/types';
import {
  Account, Proposal, ProposalStatus, ProposalEndTime, IVote, VotingType,
  VotingUnit, ChainClass, ChainEntity, ChainEvent
} from 'models';
import SubstrateChain from 'controllers/chain/substrate/shared';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import EdgewareSignaling from './signaling';

export enum SignalingProposalStage {
  PreVoting = 'prevoting',
  Commit = 'commit',
  Voting = 'voting',
  Completed = 'completed',
}

const backportEventToAdapter = (
  ChainInfo: SubstrateChain,
  event: SubstrateTypes.ISignalingNewProposal,
): IEdgewareSignalingProposal => {
  return {
    identifier: event.proposalHash,
    voteIndex: +event.voteId,
    hash: event.proposalHash,
    author: event.proposer,
    title: event.title,
    description: event.description,
    tallyType: ChainInfo.createType('TallyType', event.tallyType),
    voteType: ChainInfo.createType('VoteType', event.voteType),
    choices: event.choices.map((c) => ChainInfo.createType('VoteOutcome', c)),
  };
};

export class SignalingVote implements IVote<SubstrateCoin> {
  public readonly account: SubstrateAccount;
  public readonly choices: VoteOutcome[];
  public readonly balance: SubstrateCoin;

  constructor(
    proposal: EdgewareSignalingProposal,
    account: SubstrateAccount,
    choices: VoteOutcome[],
    balance: SubstrateCoin
  ) {
    this.account = account;
    this.choices = choices;
    this.balance = balance;
  }
}

export class EdgewareSignalingProposal
  extends Proposal<ApiPromise, SubstrateCoin, IEdgewareSignalingProposal, SignalingVote> {
  public get shortIdentifier() {
    return `#${this.data.voteIndex.toString()}`;
  }
  public get title() { return this.data.title; }
  public get description() { return this.data.description; }
  public get author() { return this.data.author ? this._Accounts.fromAddress(this.data.author) : null; }

  public get support() {
    // TODO: support multi-option votes
    // TODO: support ranked-choice votes
    // TODO: support 1p1v
    if (this.getVotes().some((v) => v.balance === undefined)) {
      // balances haven't resolved yet!
      // console.error('Balances haven\'t resolved');
      return null;
    }
    // TODO: Make more expressive when signaling choices are not YES/NO
    const isYes = (hexChoice) => {
      return hexChoice === this._Chain.createType('VoteOutcome', [1]).toHex()
        || hexChoice === this._Chain.createType('VoteOutcome', 'Yes').toHex()
        || hexChoice === this._Chain.createType('VoteOutcome', 'YES').toHex()
        || hexChoice === this._Chain.createType('VoteOutcome', 'yes').toHex();
    };

    const isNo = (hexChoice) => {
      return hexChoice === this._Chain.createType('VoteOutcome', [0]).toHex()
        || hexChoice === this._Chain.createType('VoteOutcome', 'No').toHex()
        || hexChoice === this._Chain.createType('VoteOutcome', 'NO').toHex()
        || hexChoice === this._Chain.createType('VoteOutcome', 'no').toHex();
    };

    const yesVotes = this.getVotes()
      .filter((vote) => (vote.choices.length === 1 && isYes(vote.choices[0].toHex())));
    const noVotes = this.getVotes()
      .filter((vote) => (vote.choices.length === 1 && isNo(vote.choices[0].toHex())));
    if (yesVotes.length === 0 && noVotes.length === 0) return 0;

    const yesSupport = yesVotes.reduce(((total, vote) => vote.balance.inDollars + total), 0);
    const noSupport = noVotes.reduce(((total, vote) => vote.balance.inDollars + total), 0);
    return yesSupport / (yesSupport + noSupport);
  }
  public get turnout() {
    if (this.getVotes().some((v) => v.balance === undefined)) {
      // balances haven't resolved yet!
      console.error('Balances haven\'t resolved');
      return 0;
    }
    const totalWeight = this.getVotes().reduce(
      (total, vote) => this._Chain.coins(vote.balance.add(total)),
      this._Chain.coins(0)
    );
    return totalWeight.inDollars / this._Chain.totalbalance.inDollars;
  }

  public get votingType() {
    if (this.data.voteType.toString().toLowerCase() === 'binary') {
      return VotingType.SimpleYesNoVoting;
    } else if (this.data.voteType.toString().toLowerCase() === 'multioption') {
      return VotingType.MultiOptionVoting;
    } else {
      return VotingType.RankedChoiceVoting;
    }
  }
  public get votingUnit() {
    return VotingUnit.CoinVote;
  }
  public canVoteFrom(account : Account<any>) {
    return account.chainClass === ChainClass.Edgeware;
  }
  get isPassing() {
    return ProposalStatus.None;
  }

  private _stage = SignalingProposalStage.PreVoting;
  get stage() {
    return this._stage;
  }

  private _endBlock: number;
  get endTime(): ProposalEndTime {
    return this.completed
      ? { kind: 'unavailable' }
      : this._endBlock
        ? { kind: 'fixed_block', blocknum: this._endBlock }
        : { kind: 'not_started' };
  }

  // CONSTRUCTOR
  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Signaling: EdgewareSignaling;

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Signaling: EdgewareSignaling,
    entity: ChainEntity,
  ) {
    super('signalingproposal', backportEventToAdapter(
      ChainInfo,
      entity.chainEvents
        .find(
          (e) => e.data.kind === SubstrateTypes.EventKind.SignalingNewProposal
        ).data as SubstrateTypes.ISignalingNewProposal
    ));
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Signaling = Signaling;
    this.createdAt = entity.createdAt;

    entity.chainEvents.forEach((e) => this.update(e));

    this._initialized = true;
    this.updateVoters();
    this._Signaling.store.add(this);
  }

  protected complete() {
    super.complete(this._Signaling.store);
  }

  // TODO: figure out why we have duplicate events
  public update(e: ChainEvent) {
    if (this.completed) {
      return;
    }
    switch (e.data.kind) {
      case SubstrateTypes.EventKind.SignalingNewProposal: {
        break;
      }
      case SubstrateTypes.EventKind.SignalingCommitStarted: {
        if (this.stage !== SignalingProposalStage.PreVoting && this.stage !== SignalingProposalStage.Commit) {
          console.error('signaling stage out of order!');
          return;
        }
        this._stage = SignalingProposalStage.Commit;
        this._endBlock = e.data.endBlock;
        break;
      }
      case SubstrateTypes.EventKind.SignalingVotingStarted: {
        if (this.stage === SignalingProposalStage.Completed) {
          console.error('signaling stage out of order!');
          return;
        }
        this._stage = SignalingProposalStage.Voting;
        this._endBlock = e.data.endBlock;
        break;
      }
      case SubstrateTypes.EventKind.SignalingVotingCompleted: {
        if (this.stage !== SignalingProposalStage.Voting) {
          console.error('signaling stage out of order!');
          return;
        }
        this._stage = SignalingProposalStage.Completed;
        this.complete();
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
  }

  public updateVoters = async () => {
    const voteRecord = await this._Chain.api.query.voting.voteRecords<Option<VoteRecord>>(this.data.voteIndex);
    if (voteRecord.isSome) {
      const record = voteRecord.unwrap();
      const balances = await Promise.all(
        record.reveals.map(([ who ]) => this._Accounts.fromAddress(who.toString()).balance)
      );
      for (const [ [ voter, reveals ], balance ] of _.zip(record.reveals, balances)) {
        const acct = this._Accounts.fromAddress(voter.toString());
        this.addOrUpdateVote(new SignalingVote(this, acct, reveals, balance));
      }
    }
  }

  public submitVoteTx(vote: SignalingVote, cb?) {
    return this._Chain.createTXModalData(
      vote.account,
      (api: ApiPromise) => api.tx.voting.reveal(this.data.voteIndex, vote.choices, null),
      'submitSignalingVote',
      this.title,
      (result) => { this.updateVoters(); cb(result); }
    );
  }
}
