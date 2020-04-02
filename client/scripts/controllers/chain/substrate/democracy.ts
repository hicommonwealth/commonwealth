import { first, map, takeWhile } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { Call, Conviction, Vote as SrmlVote, BlockNumber } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import {
  ISubstrateDemocracyReferendum,
  ISubstrateDemocracyReferendumState,
  SubstrateCoin,
  DemocracyThreshold
} from 'adapters/chain/substrate/types';
import { SubstrateDemocracyReferendumAdapter } from 'adapters/chain/substrate/subscriptions';
import {
  Proposal, ProposalStatus, ProposalEndTime, BinaryVote, VotingType, VotingUnit,
  ITXModalData, ProposalModule, ChainBase, Account
} from 'models/models';
import { default as SubstrateChain } from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { ProposalStore } from 'models/stores';
import { GenericCall } from '@polkadot/types';
import { BehaviorSubject, Unsubscribable } from 'rxjs';
import { Coin } from 'adapters/currency';
import SubstrateDemocracyProposal from './democracy_proposal';

export enum DemocracyConviction {
  None = 0,
  Locked1x = 1,
  Locked2x = 2,
  Locked3x = 3,
  Locked4x = 4,
  Locked5x = 5,
  Locked6x = 6,
}

export const convictionToSubstrate = (chain: SubstrateChain, c: DemocracyConviction): Conviction => {
  return chain.createType('Conviction', c);
};

export const convictions = (): DemocracyConviction[] => [
  DemocracyConviction.None,
  DemocracyConviction.Locked1x,
  DemocracyConviction.Locked2x,
  DemocracyConviction.Locked3x,
  DemocracyConviction.Locked4x,
  DemocracyConviction.Locked5x,
  DemocracyConviction.Locked6x,
];

export const convictionToWeight = (c: DemocracyConviction | number) => {
  switch (Number(c)) {
    case DemocracyConviction.None: return 0.1;
    case DemocracyConviction.Locked1x: return 1;
    case DemocracyConviction.Locked2x: return 2;
    case DemocracyConviction.Locked3x: return 3;
    case DemocracyConviction.Locked4x: return 4;
    case DemocracyConviction.Locked5x: return 5;
    case DemocracyConviction.Locked6x: return 6;
    default: throw new Error('Invalid conviction');
  }
};

export const convictionToLocktime = (c: DemocracyConviction) => {
  switch (c) {
    case DemocracyConviction.None: return 0;
    case DemocracyConviction.Locked1x: return 1;
    case DemocracyConviction.Locked2x: return 2;
    case DemocracyConviction.Locked3x: return 4;
    case DemocracyConviction.Locked4x: return 8;
    case DemocracyConviction.Locked5x: return 16;
    case DemocracyConviction.Locked6x: return 32;
    default: throw new Error('Invalid conviction');
  }
};

export const weightToConviction = (weight: number): DemocracyConviction => {
  switch (weight) {
    case 0.1: return DemocracyConviction.None;
    case 1: return DemocracyConviction.Locked1x;
    case 2: return DemocracyConviction.Locked2x;
    case 3: return DemocracyConviction.Locked3x;
    case 4: return DemocracyConviction.Locked4x;
    case 5: return DemocracyConviction.Locked5x;
    case 6: return DemocracyConviction.Locked6x;
    default: throw new Error('Invalid weight, could not convert to Conviction');
  }
};

class SubstrateDemocracy extends ProposalModule<
  ApiRx,
  ISubstrateDemocracyReferendum,
  ISubstrateDemocracyReferendumState,
  SubstrateDemocracyReferendum,
  SubstrateDemocracyReferendumAdapter
> {
  private _enactmentPeriod: number = null;
  private _cooloffPeriod: number = null;
  private _votingPeriod: number = null;
  private _emergencyVotingPeriod: number = null;
  private _preimageByteDeposit: SubstrateCoin = null;
  get enactmentPeriod() { return this._enactmentPeriod; }
  get cooloffPeriod() { return this._cooloffPeriod; }
  get votingPeriod() { return this._votingPeriod; }
  get emergencyVotingPeriod() { return this._emergencyVotingPeriod; }
  get preimageByteDeposit() { return this._preimageByteDeposit; }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _useRedesignLogic: boolean;
  public get isRedesignLogic() { return this._useRedesignLogic; }

  // Loads all proposals and referendums currently present in the democracy module
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts, useRedesignLogic: boolean): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._useRedesignLogic = useRedesignLogic;
    return new Promise((resolve, reject) => {
      this._adapter = new SubstrateDemocracyReferendumAdapter(useRedesignLogic);
      this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
        // save parameters
        this._enactmentPeriod = +(api.consts.democracy.enactmentPeriod as BlockNumber);
        this._cooloffPeriod = +(api.consts.democracy.cooloffPeriod as BlockNumber);
        this._votingPeriod = +(api.consts.democracy.votingPeriod as BlockNumber);
        this._emergencyVotingPeriod = +(api.consts.democracy.emergencyVotingPeriod as BlockNumber);
        this._preimageByteDeposit = this._Chain.coins(api.consts.democracy.preimageByteDeposit);

        // Open subscriptions
        this.initSubscription(
          api,
          (ps) => ps.map((p) => new SubstrateDemocracyReferendum(ChainInfo, Accounts, this, p))
        ).then(() => {
          this._initialized = true;
          resolve();
        }).catch((err) => {
          reject(err);
        });
      });
    });
  }

  public reapPreimage(author: SubstrateAccount, hash: string) {
    // TODO: verify that hash corresponds to an actual preimage & is in a reap-able state
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.democracy.reapPreimage(hash),
      'reapPreimage',
      'Preimage hash: ' + hash,
    );
  }

  public createTx(...args): ITXModalData {
    throw new Error('cannot directly create democracy referendum');
  }
}

export default SubstrateDemocracy;

export class SubstrateDemocracyVote extends BinaryVote<SubstrateCoin> {
  public readonly balance: SubstrateCoin;

  constructor(proposal: SubstrateDemocracyReferendum, account: SubstrateAccount, choice: boolean, balance: SubstrateCoin, weight: number) {
    super(account, choice, weight);
    this.balance = balance;
  }

  public get coinWeight(): Coin {
    return this.weight < 1 ?
        new Coin(this.balance.denom, this.balance.divn(1 / this.weight)) :
        new Coin(this.balance.denom, this.balance.muln(this.weight));
  }
}

export class SubstrateDemocracyReferendum
extends Proposal<
  ApiRx, SubstrateCoin, ISubstrateDemocracyReferendum, ISubstrateDemocracyReferendumState, SubstrateDemocracyVote
> {
  public get shortIdentifier() {
    return '#' + this.identifier.toString();
  }
  public get title() { return this._title; }
  public get description() { return null; }
  public get author() { return null; }

  public get votingType() {
    return VotingType.ConvictionYesNoVoting;
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
  private _title: string;
  private readonly _endBlock: number;

  public get executed() { return this._executed; }
  public get passed() { return this._passed; }

  // set to true or false after voting ends, but before completed = true
  private _passed: BehaviorSubject<boolean> = new BehaviorSubject(false);
  // if true, referendum also has completed = true
  private _cancelled: BehaviorSubject<boolean> = new BehaviorSubject(false);
  // if true, referendum also has completed = true
  private _executed: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public _method: Call;
  get method() { return this._method; }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Democracy: SubstrateDemocracy;

  // CONSTRUCTORS
  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Democracy: SubstrateDemocracy,
    data: ISubstrateDemocracyReferendum
  ) {
    super('referendum', data);
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Democracy = Democracy;
    this._endBlock = data.endBlock;
    this._title = `Referendum #${data.index}`;
    this.subscribe(
      this._Chain.api,
      this._Democracy.store,
      this._Democracy.adapter
    );
    this._Democracy.store.add(this);
  }

  // GETTERS AND SETTERS
  public get support() {
    if (this.getVotes().some((v) => v.balance === undefined)) {
      throw new Error('Balances haven\'t resolved');
    }
    const yesVotes = this.getVotes().filter((vote) => vote.choice === true);
    const noVotes = this.getVotes().filter((vote) => vote.choice === false);
    if (yesVotes.length === 0 && noVotes.length === 0) return 0;

    const yesSupport = yesVotes.reduce(((total, vote) => vote.balance.inDollars * vote.weight + total), 0);
    const noSupport = noVotes.reduce(((total, vote) => vote.balance.inDollars * vote.weight + total), 0);
    return yesSupport / (yesSupport + noSupport);
  }
  public get turnout() {
    return this.edgVoted.inDollars / this._Chain.totalbalance.inDollars;
  }

  private get edgVotedYes(): SubstrateCoin {
    if (this.getVotes().some((v) => v.balance === undefined)) {
      throw new Error('Balances haven\'t resolved');
    }
    return this._Chain.coins(this.getVotes()
      .filter((vote) => vote.choice === true)
      .reduce((total, vote) => vote.coinWeight.add(total), new BN(0)));
  }
  private get edgVotedNo(): SubstrateCoin {
    if (this.getVotes().some((v) => v.balance === undefined)) {
      throw new Error('Balances haven\'t resolved');
    }
    return this._Chain.coins(this.getVotes()
      .filter((vote) => vote.choice === false)
      .reduce((total, vote) => vote.coinWeight.add(total), new BN(0)));
  }
  private get edgVoted(): SubstrateCoin {
    if (this.getVotes().some((v) => v.balance === undefined)) {
      throw new Error('Balances haven\'t resolved');
    }
    return this._Chain.coins(this.getVotes()
      .reduce((total, vote) => vote.coinWeight.add(total), new BN(0)));
  }
  public get accountsVotedYes() {
    return this.getVotes()
      .filter((vote) => vote.choice === true)
      .map((vote) => vote.account);
  }
  public get accountsVotedNo() {
    return this.getVotes()
      .filter((vote) => vote.choice === false)
      .map((vote) => vote.account);
  }

  get endTime() : ProposalEndTime {
    return { kind: 'fixed_block', blocknum: this._endBlock };
  }

  get isPassing() {
    if (this._passed.getValue() === true) return ProposalStatus.Passed;
    if (this.completed === true && this._passed.getValue() === false) return ProposalStatus.Failed;
    if (this._Chain.totalbalance.eqn(0)) return ProposalStatus.None;
    if (this.edgVoted.eqn(0)) return ProposalStatus.Failing;

    // TODO double check + verify numeric computation
    let passing;
    switch (this.data.threshold) {
      case DemocracyThreshold.Supermajorityapproval:
        passing = this.edgVotedYes.sqr().div(this._Chain.totalbalance).gt(
          this.edgVotedNo.sqr().div(this.edgVoted));
        break;

      case DemocracyThreshold.Supermajorityrejection:
        passing = this.edgVotedYes.sqr().div(this.edgVoted).gt(
          this.edgVotedNo.sqr().div(this._Chain.totalbalance));
        break;

      case DemocracyThreshold.Simplemajority:
        passing = this.edgVotedYes.gt(this.edgVotedNo);
        break;

      default:
        throw new Error('invalid threshold field: ' + this.data.threshold);
    }
    return passing ? ProposalStatus.Passing : ProposalStatus.Failing;
  }

  // TRANSACTIONS
  public submitVoteTx(vote: BinaryVote<SubstrateCoin>) {
    const srmlVote = this._Chain.createType('Vote', {
      aye: vote.choice,
      conviction: convictionToSubstrate(this._Chain, weightToConviction(vote.weight))
    });
    return this._Chain.createTXModalData(
      vote.account as SubstrateAccount,
      (api: ApiRx) => api.tx.democracy.vote(this.data.index, srmlVote),
      'submitDemocracyVote',
      this.title
    );
  }
  public async proxyVoteTx(vote: BinaryVote<SubstrateCoin>) {
    const proxyFor = await (vote.account as SubstrateAccount).proxyFor.pipe(first()).toPromise();
    if (!proxyFor) {
      throw new Error('not a proxy');
    }
    const srmlVote = this._Chain.createType('Vote', {
      aye: vote.choice,
      conviction: convictionToSubstrate(this._Chain, weightToConviction(vote.weight)),
    });
    return this._Chain.createTXModalData(
      vote.account as SubstrateAccount,
      (api: ApiRx) => api.tx.democracy.proxyVote(this.data.index, srmlVote),
      'submitProxyDemocracyVote',
      this.title
    );
  }

  public async notePreimage(author: SubstrateAccount, action: Call) {
    const hash = action.hash;
    if (hash !== this.data.hash) {
      throw new Error('preimage does not match proposal hash');
    }
    const hexCall = action.toHex();
    const preimageDeposit = (this._Chain.coins(this._Democracy.preimageByteDeposit)).muln(hexCall.length / 2);
    const canWithdraw = await author.canWithdraw(preimageDeposit);
    if (!canWithdraw) {
      throw new Error('not enough funds to note preimage');
    }
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.democracy.notePreimage(hexCall),
      'notePreimage',
      this._Chain.methodToTitle(action),
    );
  }

  public noteImminentPreimage(author: SubstrateAccount, action: Call) {
    const hash = action.hash;
    if (hash !== this.data.hash) {
      throw new Error('preimage does not match proposal hash');
    }
    // if the preimage is needed for a call in the dispatch queue, it is free to note
    if (!this._passed.getValue()) {
      throw new Error('referendum is not yet in the dispatch queue');
    }
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.democracy.noteImminentPreimage(action.toHex()),
      'noteImminentPreimage',
      this._Chain.methodToTitle(action),
    );
  }

  protected updateState(store: ProposalStore<SubstrateDemocracyReferendum>, state: ISubstrateDemocracyReferendumState) {
    if (state.method) {
      this._title = this._Chain.methodToTitle(state.method);
      this._method = this._Chain.findCall(state.method.callIndex)(...state.method.args);
    }
    for (const voter of Object.keys(state.votes)) {
      const acct = this._Accounts.fromAddress(voter);
      const [ vote, conviction, balance ] = state.votes[voter];
      if (!this.hasVoted(acct)) {
        this.addOrUpdateVote(new SubstrateDemocracyVote(
          this, acct, vote, this._Chain.coins(balance), convictionToWeight(conviction)
        ));
      }
    }
    this._passed.next(state.passed);
    this._cancelled.next(state.cancelled);
    this._executed.next(state.executed);
    super.updateState(store, state);
  }
}
