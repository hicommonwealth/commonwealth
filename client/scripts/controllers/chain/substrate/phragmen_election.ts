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
import { ApiPromise } from '@polkadot/api';
import {
  ISubstratePhragmenElection,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
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
  ApiPromise, SubstrateCoin, ISubstratePhragmenElection, PhragmenElectionVote
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
    this._initCandidates();
    this._initVotes();
    this._Elections.store.add(this);
  }

  protected complete() {
    super.complete(this._Elections.store);
  }

  public update() {
    throw new Error('unimplemented');
  }

  private async _initCandidates() {
    const candidates  = await this._Chain.api.query[this.moduleName].candidates() as Vec<AccountId>;
    const completed = this !== this._Elections.activeElection;
    this._exposedCandidates = candidates.map((c) => c.toString());
    if (completed) {
      this.complete();
    }
  }

  private async _initVotes() {
    const votingData: { [voter: string]: PhragmenElectionVote } = {};
    if (this._Chain.api.query[this.moduleName].voting) {
      const voting = await this._Chain.api.query[this.moduleName].voting.entries();
      for (const [ key, [ stake, votes ]] of voting as Array<[StorageKey, [ BalanceOf, Vec<AccountId> ] & Codec ]>) {
        const voter = key.args[0].toString();
        const vote = new PhragmenElectionVote(
          this._Accounts.get(voter),
          votes.map((v) => v.toString()),
          stake ? this._Chain.coins(stake) : this._Chain.coins(0),
        );
        votingData[voter] = vote;
      }
    } else {
      // this branch is for edgeware
      const voting = await this._Chain.api.query[this.moduleName].votesOf();
      const [ voters, votes ] = voting as [ Vec<AccountId>, Vec<Vec<AccountId>> ] & Codec;
      const stakes = await this._Chain.api.queryMulti(
        voters.map((who) => [ this._Chain.api.query[this.moduleName].stakeOf, who ])
      ) as BalanceOf[];

      const voteDataArray = _.zip(voters, votes, stakes) as Array<[ AccountId, Vec<AccountId>, BalanceOf ]>;
      for (const [ voter, voterVotes, stake ] of voteDataArray) {
        const vote = new PhragmenElectionVote(
          this._Accounts.get(voter.toString()),
          voterVotes.map((v) => v.toString()),
          this._Chain.coins(stake)
        );
        votingData[voter.toString()] = vote;
      }
    }

    // first, remove all retracted voters
    for (const currentVoter of this.getVoters()) {
      if (!votingData[currentVoter]) {
        this.removeVote(this._Accounts.get(currentVoter));
      }
    }

    // then, add or update all votes
    for (const vote of Object.values(votingData)) {
      if (!this._Accounts.isZero(vote.account.address) && vote.stake.gtn(0)) {
        this.addOrUpdateVote(vote);
      }
    }
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

  public submitVoteTx(vote: PhragmenElectionVote) {
    return this._Chain.createTXModalData(
      vote.account,
      (api: ApiPromise) => api.tx[this.moduleName].vote(vote.votes, vote.stake),
      'vote',
      this.title,
    );
  }
  public removeVoterTx(voter: SubstrateAccount) {
    return this._Chain.createTXModalData(
      voter,
      (api: ApiPromise) => api.tx[this.moduleName].removeVoter(),
      'removeVoter',
      this.title
    );
  }
  public reportDefunctVoterTx(reporter: SubstrateAccount, voter: SubstrateAccount) {
    return this._Chain.createTXModalData(
      reporter,
      (api: ApiPromise) => api.tx[this.moduleName].reportDefunctVoter(voter.address),
      'reportDefunctVoter',
      this.title
    );
  }
  public async submitCandidacyTx(candidate: SubstrateAccount) {
    // handle differing versions of Substrate API
    const txFunc = (api: ApiPromise) => {
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
      (api: ApiPromise) => api.tx[this.moduleName].renounceCandidacy(),
      'renounceCandidacy',
      this.title
    );
  }
}
