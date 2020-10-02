import _ from 'underscore';
import {
  Proposal,
  IVote,
  VotingType,
  VotingUnit,
  Account,
  ChainBase,
  ProposalStatus,
  IFixedBlockEndTime,
} from 'models';
import { ApiRx } from '@polkadot/api';
import {
  ISubstratePhragmenElection,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
import { takeWhile, first, flatMap, map } from 'rxjs/operators';
import { combineLatest, of, Unsubscribable } from 'rxjs';
import BN from 'bn.js';
import { BalanceOf, AccountId } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { Vec, StorageKey } from '@polkadot/types';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstratePhragmenElections from './phragmen_elections';

// inheriting from Vote to satisfy submitVoteTx requirement,
// but choice/conviction are unused
export class PhragmenElectionVote implements IVote<SubstrateCoin> {
  public readonly account: SubstrateAccount;
  public readonly votes: string[];
  public readonly stake: SubstrateCoin;
  constructor(account: SubstrateAccount, votes: string[], stake: SubstrateCoin) {
    this.account = account;
    this.votes = votes;
    this.stake = stake;
  }
}

export class SubstratePhragmenElection extends Proposal<
  ApiRx, SubstrateCoin, ISubstratePhragmenElection, PhragmenElectionVote
> {
  get shortIdentifier() {
    return `PELEC-${this.identifier.toString()}`;
  }

  private readonly _title: string;
  public get title() { return this._title; }
  public get description() { return null; }
  public get author() { return null; }

  public get support() {
    return null;
  }
  public get turnout() {
    return this._Chain.coins(this.getVotes()
      .reduce(
        (total, vote) => vote.stake.add(total),
        new BN(0)
      )).inDollars / this._Chain.totalbalance.inDollars;
  }

  public get votingType() {
    return VotingType.SimpleYesApprovalVoting;
  }
  public get votingUnit() {
    return VotingUnit.CoinVote;
  }
  public canVoteFrom(account: Account<any>) {
    return account.chainBase === ChainBase.Substrate;
  }
  get isPassing() {
    return ProposalStatus.None;
  }
  get endTime() : IFixedBlockEndTime {
    return { kind: 'fixed_block', blocknum: this.data.endBlock };
  }

  private _exposedCandidates: string[] = [];
  public get exposedCandidates() { return this._exposedCandidates; }
  public get candidates() {
    return [...this._exposedCandidates, ...this._Elections.members, ...this._Elections.runnersUp];
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Elections: SubstratePhragmenElections;
  private readonly moduleName: string;

  private _voteSubscription: Unsubscribable;
  private _candidateSubscription: Unsubscribable;

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Elections: SubstratePhragmenElections,
    data: ISubstratePhragmenElection,
    moduleName: string,
  ) {
    super('phragmenelection', data);
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Elections = Elections;
    this._title = `Set council votes for election ${data.round}`;
    this.moduleName = moduleName;

    this._initialized.next(true);
    this._subscribeCandidates();
    this._subscribeVotes();
    this._Elections.store.add(this);
  }

  protected complete() {
    super.complete(this._Elections.store);
  }

  public update() {
    throw new Error('unimplemented');
  }

  private _subscribeCandidates(): Unsubscribable {
    return this._Chain.query((api) => api.query[this.moduleName].candidates()).pipe(
      map((candidates: Vec<AccountId>) => {
        const completed = this !== this._Elections.activeElection;
        return { completed, candidates: candidates.map((c) => c.toString()) };
      }),
      takeWhile(({ completed }) => !completed && this.initialized, true),
    ).subscribe(({ completed, candidates }) => {
      this._exposedCandidates = candidates;
      if (completed) {
        this.complete();
      }
    });
  }

  // This call listens for and updates the election's voter list. We perform this logic
  // here rather than in adapters because the voters storage is done via Observable, so
  // the logic becomes simpler and more efficient, thanks to direct access to the
  // addOrUpdateVote call. If implemented in adapters, we'd need costly diffs or unneccessary
  // updates, as voters would be returned in a single array or map.
  private _subscribeVotes(): Unsubscribable {
    return this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
      (api.query[this.moduleName].voting
        // this branch is for kusama
        ? api.query[this.moduleName].voting.entries().pipe(
          map((voting: Array<[StorageKey, [ BalanceOf, Vec<AccountId> ] & Codec ]>) => {
            const votingData: { [voter: string]: PhragmenElectionVote } = { };
            // eslint-disable-next-line no-restricted-syntax
            for (const [ key, [ stake, votes ]] of voting) {
              const voter = key.args[0].toString();
              const vote = new PhragmenElectionVote(
                this._Accounts.get(voter),
                votes.map((v) => v.toString()),
                stake ? this._Chain.coins(stake) : this._Chain.coins(0),
              );
              votingData[voter] = vote;
            }
            return votingData;
          })
        )
        // this branch is for edgeware
        : api.query[this.moduleName].votesOf().pipe(
          flatMap(([ voters, votes ]: [ Vec<AccountId>, Vec<Vec<AccountId>> ] & Codec) => {
            return combineLatest(
              of(voters),
              of(votes),
              api.queryMulti(
                voters.map((who) => [ api.query[this.moduleName].stakeOf, who ])
              ),
            );
          }),
          map(([ voters, votes, stakes ]: [ Vec<AccountId>, Vec<Vec<AccountId>>, BalanceOf[] ]) => {
            const votingData: { [voter: string]: PhragmenElectionVote } = {};
            const voteDataArray = _.zip(voters, votes, stakes) as Array<[ AccountId, Vec<AccountId>, BalanceOf ]>;
            // eslint-disable-next-line no-restricted-syntax
            for (const [ voter, voterVotes, stake ] of voteDataArray) {
              const vote = new PhragmenElectionVote(
                this._Accounts.get(voter.toString()),
                voterVotes.map((v) => v.toString()),
                this._Chain.coins(stake)
              );
              votingData[voter.toString()] = vote;
            }
            return votingData;
          })
        ))
        .pipe(
          // automatically close on complete
          takeWhile(() => !this.completed && this.initialized),
        ).subscribe((votes: { [voter: string]: PhragmenElectionVote }) => {
          // first, remove all retracted voters
          // eslint-disable-next-line no-restricted-syntax
          for (const currentVoter of this.getVoters()) {
            if (!votes[currentVoter]) {
              this.removeVote(this._Accounts.get(currentVoter));
            }
          }

          // then, add or update all votes
          // eslint-disable-next-line no-restricted-syntax
          for (const vote of Object.values(votes)) {
            if (!this._Accounts.isZero(vote.account.address) && vote.stake.gtn(0)) {
              this.addOrUpdateVote(vote);
            }
          }
        });
    });
  }

  public isDefunctVoter(voter: SubstrateAccount) {
    const votes = this.getVotes(voter);
    if (!votes) throw new Error('must be a voter');
    // eslint-disable-next-line no-restricted-syntax
    for (const vote of votes[0].votes) {
      if (this.candidates.includes(vote)) {
        return false;
      }
    }
    return true;
  }

  public submitVoteTx(vote: PhragmenElectionVote) {
    return this._Chain.createTXModalData(
      vote.account,
      (api: ApiRx) => api.tx[this.moduleName].vote(vote.votes, vote.stake),
      'vote',
      this.title,
    );
  }
  public removeVoterTx(voter: SubstrateAccount) {
    return this._Chain.createTXModalData(
      voter,
      (api: ApiRx) => api.tx[this.moduleName].removeVoter(),
      'removeVoter',
      this.title
    );
  }
  public reportDefunctVoterTx(reporter: SubstrateAccount, voter: SubstrateAccount) {
    return this._Chain.createTXModalData(
      reporter,
      (api: ApiRx) => api.tx[this.moduleName].reportDefunctVoter(voter.address),
      'reportDefunctVoter',
      this.title
    );
  }
  public async submitCandidacyTx(candidate: SubstrateAccount) {
    // handle differing versions of Substrate API
    const txFunc = (api: ApiRx) => {
      if (api.tx[this.moduleName].submitCandidacy.meta.args.length === 1) {
        return api.tx[this.moduleName].submitCandidacy(this.candidates);
      } else {
        return api.tx[this.moduleName].submitCandidacy();
      }
    };
    return this._Chain.createTXModalData(
      candidate,
      txFunc,
      'submitCandidacy',
      this.title
    );
  }
  public renounceCandidacyTx(candidate: SubstrateAccount) {
    return this._Chain.createTXModalData(
      candidate,
      (api: ApiRx) => api.tx[this.moduleName].renounceCandidacy(),
      'renounceCandidacy',
      this.title
    );
  }
}
