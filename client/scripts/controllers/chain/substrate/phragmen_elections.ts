import {
  ProposalModule, Proposal, IVote, VotingType, VotingUnit,
  Account, ChainBase, ProposalStatus, IFixedBlockEndTime, ITXModalData
} from 'models/models';
import { ApiRx } from '@polkadot/api';
import { ISubstratePhragmenElection, ISubstratePhragmenElectionState, SubstrateCoin } from 'adapters/chain/substrate/types';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { SubstratePhragmenElectionAdapter } from 'adapters/chain/substrate/subscriptions';
import SubstrateChain from './shared';
import { takeWhile, first, switchMap, flatMap } from 'rxjs/operators';
import { Unsubscribable, combineLatest, of } from 'rxjs';
import BN from 'bn.js';
import { BalanceOf, AccountId } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { Vec, StorageKey } from '@polkadot/types';
import { ProposalStore } from 'models/stores';

type ElectionResultCodec = [ AccountId, BalanceOf ] & Codec;

class SubstratePhragmenElections extends ProposalModule<
  ApiRx,
  ISubstratePhragmenElection,
  ISubstratePhragmenElectionState,
  SubstratePhragmenElection,
  SubstratePhragmenElectionAdapter
> {
  private _candidacyBond: SubstrateCoin = null;
  private _votingBond: SubstrateCoin = null;
  private _desiredMembers: number = null;
  private _desiredRunnersUp: number = null;
  private _termDuration: number = null;
  public get candidacyBond() { return this._candidacyBond; }
  public get votingBond() { return this._votingBond; }
  public get desiredMembers() { return this._desiredMembers; }
  public get desiredRunnersUp() { return this._desiredRunnersUp; }
  public get termDuration() { return this._termDuration; }

  protected _activeElection: SubstratePhragmenElection;
  public get activeElection() { return this._activeElection; }
  public get round() { return this._activeElection.data.round; }

  private _memberSubscription: Unsubscribable;

  private _members: { [who: string]: BN };
  public get members() { return Object.keys(this._members); }
  public isMember(who: SubstrateAccount) { return !!this._members[who.address]; }

  private _runnersUp: Array<{ who: string, score: BN }>;
  public get runnersUp() { return this._runnersUp.map((r) => r.who); }
  public get nextRunnerUp() { return this._runnersUp[this._runnersUp.length - 1].who; }
  public isRunnerUp(who: SubstrateAccount) { return !!this._runnersUp.find((r) => r.who === who.address); }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public deinit() {
    if (this._memberSubscription) {
      this._memberSubscription.unsubscribe();
    }
    super.deinit();
  }

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts, moduleName: string): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    return new Promise((resolve, reject) => {
      this._adapter = new SubstratePhragmenElectionAdapter(moduleName);
      this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
        this._candidacyBond = this._Chain.coins(api.consts[moduleName].candidacyBond as BalanceOf);
        this._votingBond = this._Chain.coins(api.consts[moduleName].votingBond as BalanceOf);
        this._desiredMembers = +api.consts[moduleName].desiredMembers;
        this._desiredRunnersUp = +api.consts[moduleName].desiredRunnersUp;
        this._termDuration = +api.consts[moduleName].termDuration;

        const memberP = new Promise((memberResolve) => {
          this._memberSubscription = api.queryMulti([
            [ api.query[moduleName].members ],
            [ api.query[moduleName].runnersUp ]
          ]).subscribe(([ members, runnersUp ]: [ Vec<ElectionResultCodec>, Vec<ElectionResultCodec> ]) => {
            this._runnersUp = runnersUp.map(([ who, bal ]) => ({ who: who.toString(), score: bal.toBn() }));
            this._members = members.reduce((ms, [ who, bal ]) => {
              ms[who.toString()] = bal.toBn();
              return ms;
            }, {});
            memberResolve();
          });
        });

        const subP = this.initSubscription(
          api,
          ([ p ]) => {
            this._activeElection = new SubstratePhragmenElection(ChainInfo, Accounts, this, p, moduleName);
            return [ this._activeElection ];
          }
        );
        
        Promise.all([subP, memberP]).then(() => {
          this._initialized = true;
          resolve();
        }).catch((err) => {
          reject(err);
        });
      });
    });
  }

  public createTx(...args): ITXModalData {
    throw new Error('cannot directly create election');
  }
}

export default SubstratePhragmenElections;

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
  ApiRx, SubstrateCoin, ISubstratePhragmenElection, ISubstratePhragmenElectionState, PhragmenElectionVote
> {

  get shortIdentifier() {
    return 'PELEC-' + this.identifier.toString();
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
      .reduce((total, vote) => vote.stake.add(total), new BN(0))).inDollars /
      this._Chain.totalbalance.inDollars;
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
  public canCreateFrom(account: Account<any>) {
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
    this._title = `Election ${data.round}`;
    this.moduleName = moduleName;

    // don't use this.subscribe() bc we need to pass moduleName
    this._subscription = this._Chain.api.pipe(
      switchMap((api: ApiRx) =>
        this._Elections.adapter.subscribeState(api, this.data))
    ).subscribe((s) => this.updateState(this._Elections.store, s));
    this.subscribeVotes();
    this._Elections.store.add(this);
  }

  // This call listens for and updates the election's voter list. We perform this logic
  // here rather than in adapters because the voters storage is done via Observable, so
  // the logic becomes simpler and more efficient, thanks to direct access to the
  // addOrUpdateVote call. If implemented in adapters, we'd need costly diffs or unneccessary
  // updates, as voters would be returned in a single array or map.
  private subscribeVotes() {
    this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
      api.query[this.moduleName].votesOf.entries().pipe(
        // automatically close on complete
        takeWhile(() => !this.completed),
        flatMap((votes: Array<[StorageKey, Vec<AccountId>]>) => {
          return combineLatest(
            of(votes),
            // update stakes too whenever the map gets updated -- changes in
            // stake values will push updates here as well
            api.queryMulti(votes.map(([ voter, votedFor ]) => {
              return [ api.query[this.moduleName].stakeOf, voter ];
            })).pipe(first()),
          );
        }),
      ).subscribe(([ votes, stakes ]: [ Array<[StorageKey, Vec<AccountId>]>, BalanceOf[] ]) => {
        // first, remove all retracted voters
        for (const currentVoter of this.getVoters()) {
          if (votes.find(([ voter ]) => voter.toString() === currentVoter) === undefined) {
            this.removeVote(this._Accounts.get(currentVoter));
          }
        }

        // then, add or update all votes
        for (const [ i, [ voter, votedFor ] ] of votes.entries()) {
          if (!this._Accounts.isZero(voter.toString())) {
            const stake = this._Chain.coins(stakes[i]);
            const voterAcct = this._Accounts.fromAddress(voter.toString());
            const voteStrings = votedFor.map((v) => v.toString());
            this.addOrUpdateVote(new PhragmenElectionVote(voterAcct, voteStrings, stake));
          }
        }
      });
    });
  }

  public isDefunctVoter(voter: SubstrateAccount) {
    const votes = this.getVotes(voter);
    if (!votes) throw new Error('must be a voter');
    for (const vote of votes[0].votes) {
      if (this.candidates.includes(vote)) {
        return false;
      }
    }
    return true;
  }

  protected updateState(store: ProposalStore<SubstratePhragmenElection>, state: ISubstratePhragmenElectionState) {
    this._exposedCandidates = state.candidates;
    super.updateState(store, state);
  }

  public submitVoteTx(vote: PhragmenElectionVote) {
    if (this.candidates.length === 0) throw new Error('cannot vote when no candidates or members');
    if (vote.votes.length === 0) throw new Error('must vote for at least one candidate');
    if (vote.votes.length > this.candidates.length) {
      throw new Error('cannot vote more than candidates');
    }
    return this._Chain.createTXModalData(
      vote.account,
      (api: ApiRx) => api.tx[this.moduleName].vote(vote.votes, vote.stake),
      'vote',
      this.title,
    );
  }
  public removeVoterTx(voter: SubstrateAccount) {
    if (!this.hasVoted(voter)) {
      throw new Error('must be a voter');
    }
    return this._Chain.createTXModalData(
      voter,
      (api: ApiRx) => api.tx[this.moduleName].removeVoter(),
      'removeVoter',
      this.title
    );
  }
  public reportDefunctVoterTx(reporter: SubstrateAccount, voter: SubstrateAccount) {
    if (reporter.address === voter.address) throw new Error('cannot report self');
    if (!this.hasVoted(reporter)) throw new Error('reporter must be a voter');
    if (!this.isDefunctVoter(voter)) throw new Error('voter not defunct');
    return this._Chain.createTXModalData(
      reporter,
      (api: ApiRx) => api.tx[this.moduleName].reportDefunctVoter(voter.address),
      'reportDefunctVoter',
      this.title
    );
  }
  public async submitCandidacyTx(candidate: SubstrateAccount) {
    if (this.candidates.includes(candidate.address)) {
      throw new Error('duplicate candidate');
    }
    const canWithdraw = await candidate.canWithdraw(this._Elections.candidacyBond);
    if (!canWithdraw) {
      throw new Error('not enough funds to submit candidacy');
    }
    return this._Chain.createTXModalData(
      candidate,
      (api: ApiRx) => api.tx[this.moduleName].submitCandidacy(),
      'submitCandidacy',
      this.title
    );
  }
  public renounceCandidacyTx(candidate: SubstrateAccount) {
    if (!this.candidates.includes(candidate.address)) {
      throw new Error('must be candidate, member, or runner-up');
    }
    return this._Chain.createTXModalData(
      candidate,
      (api: ApiRx) => api.tx[this.moduleName].renounceCandidacy(),
      'renounceCandidacy',
      this.title
    );
  }
}
