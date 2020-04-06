import { map } from 'rxjs/operators';
import BN from 'bn.js';
import { ProposalStore } from 'models/stores';
import { Call, Proposal } from '@polkadot/types/interfaces';
import { GenericCall, getTypeDef } from '@polkadot/types';
import { Codec, TypeDef } from '@polkadot/types/types';
import { ApiRx } from '@polkadot/api';
import {
  ISubstrateDemocracyProposal,
  ISubstrateDemocracyProposalState,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
import {
  Proposal as ProposalModel, ProposalStatus, ProposalEndTime, DepositVote,
  VotingType, VotingUnit, ChainBase, Account
} from 'models/models';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateDemocracyProposals from './democracy_proposals';

interface Param {
  name: string;
  type: TypeDef;
}

interface Value {
  isValid: boolean;
  value: Codec;
}

class SubstrateDemocracyProposal extends ProposalModel<
  ApiRx,
  SubstrateCoin,
  ISubstrateDemocracyProposal,
  ISubstrateDemocracyProposalState,
  DepositVote<SubstrateCoin>
> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }

  public get title() { return this._title; }

  public get description() { return null; }

  public get author() { return this._author; }

  public get hash() { return this._hash; }

  public get votingType() {
    return VotingType.SimpleYesApprovalVoting;
  }

  public get votingUnit() {
    return VotingUnit.CoinVote;
  }

  public canVoteFrom(account: Account<any>) {
    return account.chainBase === ChainBase.Substrate;
  }

  private _title: string;

  private readonly _author: SubstrateAccount;

  private _hash: string;

  public readonly deposit: SubstrateCoin;

  public _methodCall: Call;

  get methodCall() { return this._methodCall; }

  public _method: string;

  get method() { return this._method; }

  public _section: string;

  get section() { return this._section; }

  public _params: Param[];

  get params() { return this._params; }

  public _values: Value[];

  get values() { return this._values; }

  public get support(): SubstrateCoin {
    return this._Chain.coins(this.getVotes()
      .reduce((total, vote) => vote.deposit.add(total), new BN(0)));
  }

  public get turnout() {
    return this.support.inDollars / this._Chain.totalbalance.inDollars;
  }

  private _Chain: SubstrateChain;

  private _Accounts: SubstrateAccounts;

  private _Proposals: SubstrateDemocracyProposals;

  // CONSTRUCTORS
  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Proposals: SubstrateDemocracyProposals,
    data: ISubstrateDemocracyProposal
  ) {
    super('democracyproposal', data);
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Proposals = Proposals;
    this._title = data.hash.toString();
    this.deposit = this._Chain.coins(data.deposit);
    this._author = this._Accounts.fromAddress(data.author);
    this._hash = data.hash.toString();
    this.subscribe(
      this._Chain.api,
      this._Proposals.store,
      this._Proposals.adapter
    );
    this._Proposals.store.add(this);
    // grabs the proposal given a preimage hash and processes different parts of the proposal call
    (async () => {
      await this._Proposals.getProposal(this._hash).pipe(map((proposal: Proposal) => {
        if (proposal) {
          const { method, section } = this._Chain.registry.findMetaCall(proposal.callIndex);
          this._method = method;
          this._section = section;
          this._params = GenericCall.filterOrigin(proposal.meta).map(({ name, type }): Param => ({
            name: name.toString(),
            type: getTypeDef(type.toString())
          }));
          this._values = proposal.args.map((value): Value => ({
            isValid: true,
            value
          }));
          this._title = `${this._section}.${this.method}(${this._values.map((v) => {
            return v.value.toString();
          }).join(', ')})`;
        }
      })).toPromise();
    })();
  }

  // GETTERS AND SETTERS
  get endTime() : ProposalEndTime {
    if (!this._Proposals.lastTabledWasExternal && this._Proposals.nextExternal)
      return { kind: 'queued' };
    return this.isPassing === ProposalStatus.Passing ?
      { kind: 'dynamic', getBlocknum: () => this._Proposals.nextLaunchBlock } :
      this.isPassing === ProposalStatus.Failing
        ? { kind: 'queued' }
        : { kind: 'unavailable' };
  }

  get isPassing() {
    if (this.completed) return ProposalStatus.Passed;
    const proposals = this._Proposals.store.getAll();
    proposals.sort((a: SubstrateDemocracyProposal, b: SubstrateDemocracyProposal) => {
      if (a.support.lt(b.support)) return -1;
      if (a.support.gt(b.support)) return 1;
      if (a.data.index < b.data.index) return -1;
      if (a.data.index > b.data.index) return 1;
      return 0;
    });
    proposals.reverse();
    return (this === proposals[0]) ? ProposalStatus.Passing : ProposalStatus.Failing;
  }

  // TRANSACTIONS
  public submitVoteTx(vote: DepositVote<SubstrateCoin>) {
    // deposit parameter is ignored
    return this._Chain.createTXModalData(
      vote.account as SubstrateAccount,
      (api: ApiRx) => api.tx.democracy.second(this.data.index),
      'secondDemocracyProposal',
      this.title
    );
  }

  // SUBSCRIPTIONS
  protected updateState(store: ProposalStore<SubstrateDemocracyProposal>, state: ISubstrateDemocracyProposalState) {
    if (state.method) {
      this._title = this._Chain.methodToTitle(state.method);
      this._methodCall = this._Chain.findCall(state.method.callIndex)(...state.method.args);
    }
    this.clearVotes();
    // eslint-disable-next-line no-restricted-syntax
    for (const depositor of state.depositors) {
      const acct = this._Accounts.fromAddress(depositor);
      const votes = this.getVotes(acct);
      if (!votes.length) {
        this.addOrUpdateVote(new DepositVote(acct, this._Chain.coins(this.data.deposit)));
      } else {
        // if they second a proposal multiple times, sum up the vote weight
        const vote = new DepositVote(acct, this._Chain.coins(votes[0].deposit.add(this.data.deposit)));
        this.addOrUpdateVote(vote);
      }
    }
    super.updateState(store, state);
  }
}

export default SubstrateDemocracyProposal;
