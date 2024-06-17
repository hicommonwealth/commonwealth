import type { ProposalType } from '@hicommonwealth/shared';
import type { Coin } from 'adapters/currency';
import type { IIdentifiable } from 'adapters/shared';
import { EventEmitter } from 'events';
import type moment from 'moment';
import type { ProposalStore } from '../stores';
import type Account from './Account';
import type ChainEvent from './ChainEvent';
import type { ITXModalData, IUniqueId, IVote } from './interfaces';
import type {
  ProposalEndTime,
  ProposalStatus,
  VotingType,
  VotingUnit,
} from './types';

abstract class Proposal<
  ApiT,
  C extends Coin,
  ConstructorT extends IIdentifiable,
  VoteT extends IVote<C>,
> implements IUniqueId
{
  // basic info
  protected _data: ConstructorT;
  public get data(): ConstructorT {
    return this._data;
  }

  public readonly identifier: string;
  public readonly slug: ProposalType;

  public abstract get shortIdentifier(): string;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  public createdAt: moment.Moment;
  public threadId: number;

  public abstract title: string;

  public abstract get description(): string;

  public abstract get author(): Account;

  // voting
  public abstract get votingType(): VotingType;

  public abstract get votingUnit(): VotingUnit;

  public abstract canVoteFrom(account: Account): boolean;

  protected votes: { [account: string]: VoteT } = {};

  public abstract get endTime(): ProposalEndTime;

  public abstract get isPassing(): ProposalStatus;

  public isFetched = new EventEmitter();

  // display
  public abstract get support(): Coin | number;

  public abstract get turnout(): number;

  protected _completed = false;
  get completed() {
    return this._completed;
  }

  protected _completedAt: moment.Moment; // TODO: fill this out
  get completedAt() {
    return this._completedAt;
  }

  protected _initialized = false;
  public get initialized() {
    return this._initialized;
  }

  constructor(slug: ProposalType, data: ConstructorT) {
    this.slug = slug;
    this._data = data;
    this.identifier = data.identifier;
  }

  public abstract update(e: ChainEvent): any;

  public updateVoters?: () => Promise<void>;

  protected complete(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    store: ProposalStore<Proposal<ApiT, C, ConstructorT, VoteT>>,
  ): void {
    if (this._completed) {
      console.warn(
        `Warning: state marked as complete multiple times on proposal ${this.identifier}`,
      );
    }
    this._completed = true;
    this._initialized = true;
  }

  public deinit() {
    this._initialized = false;
  }

  // voting
  public addOrUpdateVote(vote: VoteT) {
    this.votes[vote.account.address] = vote;
  }

  public removeVote(account: Account) {
    if (this.hasVoted(account)) {
      delete this.votes[account.address];
    }
  }

  public clearVotes() {
    this.votes = {};
  }

  // TODO: these can be observables, if we want
  public hasVoted(account: Account) {
    return this.votes[account.address] !== undefined;
  }

  public getVotes(fromAccount?: Account) {
    if (fromAccount) {
      return this.votes[fromAccount.address] !== undefined
        ? [this.votes[fromAccount.address]]
        : [];
    } else {
      return Object.values(this.votes);
    }
  }

  public getVoters(): string[] {
    return Object.keys(this.votes);
  }

  public abstract submitVoteTx(
    vote: VoteT,
    ...args
  ): ITXModalData | Promise<ITXModalData>;
}

export default Proposal;
