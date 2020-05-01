import _ from 'underscore';
import { takeWhile } from 'rxjs/operators';
import { Unsubscribable } from 'rxjs';
import BN from 'bn.js';
import { ApiRx } from '@polkadot/api';
import { ISubstrateDemocracyProposal, SubstrateCoin } from 'adapters/chain/substrate/types';
import {
  Proposal as ProposalModel, ProposalStatus, ProposalEndTime, DepositVote,
  VotingType, VotingUnit, ChainBase, Account, ChainEntity, ChainEvent
} from 'models';
import {
  SubstrateEventKind, ISubstrateDemocracyProposed,
  SubstrateEntityKind, ISubstratePreimageNoted,
} from 'events/edgeware/types';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateDemocracyProposals from './democracy_proposals';

const backportEventToAdapter = (
  ChainInfo: SubstrateChain,
  event: ISubstrateDemocracyProposed,
): ISubstrateDemocracyProposal => {
  const enc = new TextEncoder();
  return {
    identifier: event.proposalIndex.toString(),
    index: event.proposalIndex,
    hash: enc.encode(event.proposalHash),
    deposit: ChainInfo.createType('u128', event.deposit),
    author: event.proposer,
  };
};

class SubstrateDemocracyProposal extends ProposalModel<
  ApiRx,
  SubstrateCoin,
  ISubstrateDemocracyProposal,
  DepositVote<SubstrateCoin>
> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }

  private _title: string;
  public get title() { return this._title; }

  public get description() { return null; }

  private readonly _author: SubstrateAccount;
  public get author() { return this._author; }

  private _hash: string;
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

  public readonly deposit: SubstrateCoin;

  public _method: string;
  get method() { return this._method; }

  public _section: string;
  get section() { return this._section; }

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

  private _depositSubscription: Unsubscribable;

  // CONSTRUCTORS
  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Proposals: SubstrateDemocracyProposals,
    entity: ChainEntity,
  ) {
    // fake adapter data
    super('democracyproposal', backportEventToAdapter(
      ChainInfo,
      entity.chainEvents
        .find((e) => e.data.kind === SubstrateEventKind.DemocracyProposed).data as ISubstrateDemocracyProposed
    ));
    const eventData = entity.chainEvents
      .find((e) => e.data.kind === SubstrateEventKind.DemocracyProposed).data as ISubstrateDemocracyProposed;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Proposals = Proposals;
    this.deposit = this._Chain.coins(new BN(eventData.deposit, 10));
    this._author = this._Accounts.fromAddress(eventData.proposer);
    this._hash = eventData.proposalHash;

    // see if preimage exists and populate data if it does
    const preimage = this._Proposals.app.chainEntities.getPreimage(eventData.proposalHash);
    if (preimage) {
      this._method = preimage.method;
      this._section = preimage.section;
      this._title = `${this._section}.${this.method}(${preimage.args.join(', ')})`;
    } else {
      this._title = eventData.proposalHash;
    }

    entity.chainEvents.forEach((e) => this.update(e));

    this._initialized.next(true);
    this._depositSubscription = this._subscribeDepositors();
    this._Proposals.store.add(this);
  }

  protected complete() {
    super.complete(this._Proposals.store);
    if (this._depositSubscription) {
      this._depositSubscription.unsubscribe();
    }
  }

  public update(e: ChainEvent) {
    switch (e.data.kind) {
      case SubstrateEventKind.DemocracyProposed: {
        break;
      }
      case SubstrateEventKind.DemocracyTabled: {
        this.complete();
        break;
      }
      case SubstrateEventKind.PreimageNoted: {
        const preimage = this._Proposals.app.chainEntities.getPreimage(this._hash);
        if (preimage) {
          this._method = preimage.method;
          this._section = preimage.section;
          this._title = `${this._section}.${this.method}(${preimage.args.join(', ')})`;
        }
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
  }

  private _subscribeDepositors(): Unsubscribable {
    return this._Chain.query((api) => api.query.democracy.depositOf(this.data.index))
      .pipe(takeWhile((v) => v.isSome))
      .subscribe((depositOpt) => {
        const [ deposit, depositors ] = depositOpt.unwrap();
        // eslint-disable-next-line no-restricted-syntax
        for (const depositor of depositors) {
          const acct = this._Accounts.fromAddress(depositor.toString());
          const votes = this.getVotes(acct);
          if (!votes.length) {
            this.addOrUpdateVote(new DepositVote(acct, this._Chain.coins(this.data.deposit)));
          } else {
            // if they second a proposal multiple times, sum up the vote weight
            const vote = new DepositVote(acct, this._Chain.coins(votes[0].deposit.add(this.data.deposit)));
            this.addOrUpdateVote(vote);
          }
        }
      });
  }

  // GETTERS AND SETTERS
  get endTime() : ProposalEndTime {
    if (!this._Proposals.lastTabledWasExternal && this._Proposals.nextExternal)
      return { kind: 'queued' };
    return this.isPassing === ProposalStatus.Passing
      ? { kind: 'dynamic', getBlocknum: () => this._Proposals.nextLaunchBlock }
      : this.isPassing === ProposalStatus.Failing
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
}

export default SubstrateDemocracyProposal;
