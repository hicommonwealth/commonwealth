import _ from 'underscore';
import { combineLatest, of, BehaviorSubject, Unsubscribable } from 'rxjs';
import { takeWhile, flatMap, take } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { Votes } from '@polkadot/types/interfaces';
import { Option } from '@polkadot/types';
import { ISubstrateCollectiveProposal, SubstrateCoin } from 'adapters/chain/substrate/types';
import {
  Proposal, ProposalStatus, ProposalEndTime, BinaryVote, VotingType,
  VotingUnit, ChainEntity, ChainEvent
} from 'models';
import { ISubstrateCollectiveProposed, SubstrateEventKind } from 'events/edgeware/types';
import { default as SubstrateChain } from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateCollective from './collective';

export class SubstrateCollectiveVote extends BinaryVote<SubstrateCoin> {
  public readonly balance: SubstrateCoin;

  constructor(
    proposal: SubstrateCollectiveProposal,
    account: SubstrateAccount,
    choice: boolean,
    balance: SubstrateCoin
  ) {
    super(account, choice);
    this.balance = balance;
  }
}

const backportEventToAdapter = (event: ISubstrateCollectiveProposed): ISubstrateCollectiveProposal => {
  return {
    identifier: event.proposalHash.toString(),
    index: event.proposalIndex,
    threshold: event.threshold,
    hash: event.proposalHash,
  };
};

export class SubstrateCollectiveProposal
  extends Proposal<
  ApiRx, SubstrateCoin, ISubstrateCollectiveProposal, SubstrateCollectiveVote
> {
  public get shortIdentifier() {
    return `#${this.data.index.toString()}`;
  }
  public get title() { return this._title; }
  public get description() { return null; }
  public get author() { return null; }

  // MEMBERS
  public canVoteFrom(account: SubstrateAccount) {
    return this._Collective.isMember(account);
  }
  private readonly _title: string;
  private _approved: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Collective: SubstrateCollective;
  public get collectiveName(): string {
    return this._Collective.moduleName;
  }

  // CONSTRUCTORS
  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Collective: SubstrateCollective,
    entity: ChainEntity,
  ) {
    super('councilmotion', backportEventToAdapter(
      entity.chainEvents
        .find((e) => e.data.kind === SubstrateEventKind.CollectiveProposed).data as ISubstrateCollectiveProposed
    ));
    const eventData = entity.chainEvents
      .find((e) => e.data.kind === SubstrateEventKind.CollectiveProposed).data as ISubstrateCollectiveProposed;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Collective = Collective;
    this._title = `${eventData.call.section}.${eventData.call.method}(${eventData.call.args.join(', ')})`;

    entity.chainEvents.forEach((e) => this.update(e));

    this._initialized.next(true);
    this._subscribeVoters();
    this._Collective.store.add(this);
  }

  protected complete() {
    super.complete(this._Collective.store);
  }

  public update(e: ChainEvent) {
    if (this.completed) {
      return;
    }
    switch (e.data.kind) {
      case SubstrateEventKind.CollectiveProposed: {
        break;
      }
      case SubstrateEventKind.CollectiveDisapproved: {
        this._approved.next(false);
        this.complete();
        break;
      }
      case SubstrateEventKind.CollectiveApproved: {
        this._approved.next(true);
        break;
      }
      case SubstrateEventKind.CollectiveExecuted: {
        if (!this._approved.value) {
          this._approved.next(true);
        }
        this.complete();
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
  }

  private _subscribeVoters(): Unsubscribable {
    return this._Chain.query((api) => api.query[this.collectiveName].voting<Option<Votes>>(this.data.hash))
      .pipe(
        takeWhile((v) => v.isSome && this.initialized && !this.completed),

        // grab latest voter balances as well, to avoid subscribing to each on vote-creation
        flatMap((v) => combineLatest(
          of(v),
          combineLatest(
            v.unwrap().ayes.map((who) => this._Accounts.fromAddress(who.toString()).balance)
          ).pipe(take(1)),
          combineLatest(
            v.unwrap().nays.map((who) => this._Accounts.fromAddress(who.toString()).balance)
          ).pipe(take(1)),
        )),
      )
      .subscribe(([ v, ayeBalances, nayBalances ]) => {
        const votes = v.unwrap();
        const ayes = votes.ayes;
        const nays = votes.nays;
        // eslint-disable-next-line no-restricted-syntax
        for (const [ voter, balance ] of _.zip(ayes, ayeBalances)) {
          const acct = this._Accounts.fromAddress(voter.toString());
          this.addOrUpdateVote(new SubstrateCollectiveVote(this, acct, true, balance));
        }
        // eslint-disable-next-line no-restricted-syntax
        for (const [ voter, balance ] of _.zip(nays, nayBalances)) {
          const acct = this._Accounts.fromAddress(voter.toString());
          this.addOrUpdateVote(new SubstrateCollectiveVote(this, acct, false, balance));
        }
      });
  }

  // GETTERS AND SETTERS
  public get votingType() {
    return VotingType.SimpleYesNoVoting;
  }
  public get votingUnit() {
    return VotingUnit.OnePersonOneVote;
  }
  get isPassing() {
    if (this.completed) {
      return this._approved.getValue()
        ? ProposalStatus.Passed
        : ProposalStatus.Failed;
    }
    return (this.accountsVotedYes.length >= this.data.threshold)
      ? ProposalStatus.Passing
      : ProposalStatus.Failing;
  }
  get endTime() : ProposalEndTime {
    return { kind: 'threshold', threshold: this.data.threshold };
  }

  public get support() {
    return this.accountsVotedYes.length + this.accountsVotedNo.length === 0
      ? 0 : this.accountsVotedYes.length / (this.accountsVotedYes.length + this.accountsVotedNo.length);
  }
  public get turnout() {
    return this._Collective.members.length === 0
      ? 0 : (this.accountsVotedYes.length + this.accountsVotedNo.length) / this._Collective.members.length;
  }

  get approved() {
    return this._approved.getValue();
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

  // TRANSACTIONS
  public static get motions() {
    return [
      {
        name: 'createExternalProposal',
        label: 'Create council proposal (50% councillors, supermajority public approval)',
        description: 'Introduces a council proposal. Requires approval from 1/2 of councillors, after which '
          + 'it turns into a supermajority-required referendum.',
      }, {
        name: 'createExternalProposalMajority',
        label: 'Create majority-approval council proposal (2/3 councillors, majority public approval)',
        description: 'Introduces a council proposal. Requires approval from 2/3 of councillors, after which '
          + 'it turns into a 50% approval referendum.',
      // createExternalProposalDefault and createFastTrack not supported on edgeware
      // XXX: support on Kusama
      // }, {
      //   name: 'createExternalProposalDefault',
      //   label: 'Create negative-turnout-bias council proposal (100% councillors, supermajority public rejection)',
      //   description: 'Introduces a council proposal. Requires approval from all councillors, after which ' +
      //     'it turns into a supermajority rejection referendum (passes without supermajority voting "no").',
      // }, {
      //   name: 'createFastTrack',
      //   label: 'Fast-track the current exteranlly-proposed majority-approval referendum',
      //   description: 'Schedules a current democracy proposal for immediate consideration (i.e. a vote). ' +
      //     'If there is no externally-proposed referendum currently, or it is not majority-carried, it fails.'
      }, {
        name: 'createEmergencyCancellation',
        label: 'Emergency cancel referendum',
        description: 'Cancels an active referendum. If reintroduced, the referendum cannot be canceled again. '
          + 'Requires approval from 2/3 of councillors.',
      }, {
        name: 'vetoNextExternal',
        label: 'Veto next external proposal',
        description: 'Vetoes a council proposal. If reintroduced after the cooldown period, '
          + 'the same councillor cannot veto the proposal again.',
      }, {
        name: 'createTreasuryApprovalMotion',
        label: 'Approve treasury proposal',
        description: 'Approves a treasury proposal. This queues it up to be awarded in the next spend cycle as '
          + 'soon as there are enough treasury funds. Requires approval from 4 councillors.',
      }, {
        name: 'createTreasuryRejectionMotion',
        label: 'Reject treasury proposal',
        description: 'Rejects a treasury proposal, and burns any deposit. Requires approval from 2 councillors.',
      },
    ];
  }
  public submitVoteTx(vote: BinaryVote<SubstrateCoin>) {
    // TODO: check council status
    return this._Chain.createTXModalData(
      vote.account as SubstrateAccount,
      (api: ApiRx) => api.tx.council.vote(this.data.hash, this.data.index, vote.choice),
      'voteCouncilMotions',
      this.title
    );
  }
}
