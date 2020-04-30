import moment from 'moment-twitter';
import { BehaviorSubject, Unsubscribable, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Coin } from 'shared/adapters/currency';
import { IIdentifiable, ICompletable, ProposalAdapter } from 'shared/adapters/shared';
import { IVote, IUniqueId, ITXModalData } from './interfaces';
import { VotingType, VotingUnit, ProposalEndTime, ProposalStatus } from './types';
import Account from './Account';
import { ProposalStore } from '../stores';

abstract class Proposal<
  ApiT,
  C extends Coin,
  ConstructorT extends IIdentifiable,
  UpdateT extends ICompletable,
  VoteT extends IVote<C>
> implements IUniqueId {
  // basic info
  protected _data: ConstructorT;
  public get data(): ConstructorT { return this._data; }
  public readonly identifier: string;
  public readonly slug: string;
  public abstract get shortIdentifier(): string;
  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }
  public createdAt: moment.Moment; // TODO: unused?
  public abstract get title(): string;
  public abstract get description(): string;
  public abstract get author(): Account<C>;

  // voting
  public abstract get votingType(): VotingType;
  public abstract get votingUnit(): VotingUnit;
  public abstract canVoteFrom(account: Account<C>): boolean;

  protected votes: BehaviorSubject<{ [account: string] : VoteT }> = new BehaviorSubject({});
  // TODO: these can be observables
  public abstract get endTime(): ProposalEndTime;
  public abstract get isPassing() : ProposalStatus;

  // display
  // TODO: these should be observables
  public abstract get support(): Coin | number;
  public abstract get turnout(): number;
  // public abstract get requirementName(): string;
  // public abstract get requirementExplanation(): string;

  // adapter logic
  protected _subscription: Unsubscribable;
  protected _completed: BehaviorSubject<boolean> = new BehaviorSubject(false);
  get completed() { return this._completed.getValue(); }
  get completed$() { return this._completed.asObservable(); }
  protected _completedAt: moment.Moment; // TODO: fill this out
  get completedAt() { return this._completedAt; }

  private _initialized: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public get initialized$(): Observable<boolean> { return this._initialized.asObservable(); }
  public get initialized(): boolean { return this._initialized.value; }

  constructor(slug: string, data: ConstructorT) {
    this.slug = slug;
    this._data = data;
    this.identifier = data.identifier;
  }

  // adapter logic
  protected updateState(store: ProposalStore<Proposal<ApiT, C, ConstructorT, UpdateT, VoteT>>, state: UpdateT): void {
    if (this._completed.getValue() === true) {
      throw new Error('cannot update state once marked completed');
    }
    if (state.completed) {
      this._completed.next(true);
      this.unsubscribe();
    }
    store.update(this);
    if (!this.initialized) {
      this._initialized.next(true);
      this._initialized.complete();
    }
  }
  protected subscribe(
    api: Observable<ApiT>,
    store: ProposalStore<Proposal<ApiT, C, ConstructorT, UpdateT, VoteT>>,
    adapter: ProposalAdapter<ApiT, ConstructorT, UpdateT>
  ): void {
    this._subscription = api.pipe(
      switchMap((api2: ApiT) => adapter.subscribeState(api2, this.data))
    ).subscribe((s) => this.updateState(store, s));
  }
  public unsubscribe(): void {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }

  // voting
  public addOrUpdateVote(vote: VoteT) {
    const votes = this.votes.getValue();
    votes[vote.account.address] = vote;
    this.votes.next(votes);
  }
  public removeVote(account: Account<C>) {
    if (this.hasVoted(account)) {
      const votes = this.votes.getValue();
      delete votes[account.address];
      this.votes.next(votes);
    }
  }
  public clearVotes() {
    this.votes.next({});
  }
  // TODO: these can be observables, if we want
  public hasVoted(account: Account<C>) {
    return this.votes.getValue()[account.address] !== undefined;
  }
  public getVotes(fromAccount?: Account<C>) {
    if (fromAccount) {
      return this.votes.getValue()[fromAccount.address] !== undefined
        ? [this.votes.getValue()[fromAccount.address]] : [];
    } else {
      return Object.values(this.votes.getValue());
    }
  }
  public getVoters(): string[] {
    return Object.keys(this.votes.getValue());
  }
  public abstract submitVoteTx(vote: VoteT, ...args): ITXModalData | Promise<ITXModalData>;
}

export default Proposal;
