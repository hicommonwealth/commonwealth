import _ from 'underscore';
import { BehaviorSubject, Unsubscribable } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { Votes } from '@polkadot/types/interfaces';
import { Option } from '@polkadot/types';
import { ISubstrateCollectiveProposal, SubstrateCoin, formatCall } from 'adapters/chain/substrate/types';
import {
  Proposal, ProposalStatus, ProposalEndTime, BinaryVote, VotingType,
  VotingUnit, ChainEntity, ChainEvent
} from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateCollective from './collective';

export class SubstrateCollectiveVote extends BinaryVote<SubstrateCoin> {
  constructor(
    proposal: SubstrateCollectiveProposal,
    account: SubstrateAccount,
    choice: boolean,
  ) {
    super(account, choice);
  }
}

const backportEventToAdapter = (event: SubstrateTypes.ICollectiveProposed): ISubstrateCollectiveProposal => {
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

  // BLOCK EXPLORER LINK
  public get blockExplorerLink() {
    const chainInfo = this._Chain.app.chain?.meta?.chain;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) {
      const subdomain = blockExplorerIds['subscan'];
      return `https://${subdomain}.subscan.io/council/${this.identifier}`;
    }
  }

  public get blockExplorerLinkLabel() {
    const chainInfo = this._Chain.app.chain?.meta?.chain;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) return 'View in Subscan';
    return undefined;
  }

  public get votingInterfaceLink() {
    const rpcUrl = encodeURIComponent(this._Chain.app.user.selectedNode.url);
    return `https://polkadot.js.org/apps/?rpc=${rpcUrl}#/council/motions`;
  }

  public get votingInterfaceLinkLabel() {
    return 'Vote on polkadot-js';
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
        .find(
          (e) => e.data.kind === SubstrateTypes.EventKind.CollectiveProposed
        ).data as SubstrateTypes.ICollectiveProposed
    ));
    const eventData = entity.chainEvents
      .find(
        (e) => e.data.kind === SubstrateTypes.EventKind.CollectiveProposed
      ).data as SubstrateTypes.ICollectiveProposed;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Collective = Collective;
    this._title = formatCall(eventData.call);
    this.createdAt = entity.createdAt;

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
      case SubstrateTypes.EventKind.CollectiveProposed: {
        // proposer always submits an implicit yes vote
        if (e.data.proposer) {
          const voter = this._Accounts.fromAddress(e.data.proposer);
          this.addOrUpdateVote(new SubstrateCollectiveVote(this, voter, true));
        }
        break;
      }
      case SubstrateTypes.EventKind.CollectiveVoted: {
        const voter = this._Accounts.fromAddress(e.data.voter);
        this.addOrUpdateVote(new SubstrateCollectiveVote(this, voter, e.data.vote));
        break;
      }
      case SubstrateTypes.EventKind.CollectiveDisapproved: {
        this._approved.next(false);
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.CollectiveApproved: {
        this._approved.next(true);
        break;
      }
      case SubstrateTypes.EventKind.CollectiveExecuted: {
        if (!this._approved.value) {
          this._approved.next(true);
        }
        // unfortunately we don't have the vote at this point in time, so unless
        // we see a prior approved event, we wont be able to display it.
        this.complete();
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
  }

  private _updateVotes(ayes: SubstrateAccount[], nays: SubstrateAccount[]) {
    this.clearVotes();
    ayes.map((who) => this.addOrUpdateVote(new SubstrateCollectiveVote(this, who, true)));
    nays.map((who) => this.addOrUpdateVote(new SubstrateCollectiveVote(this, who, false)));
  }

  private _subscribeVoters(): Unsubscribable {
    return this._Chain.query((api) => api.query[this.collectiveName].voting<Option<Votes>>(this.data.hash))
      .pipe(
        takeWhile((v) => v.isSome && this.initialized && !this.approved && !this.completed),
      )
      .subscribe((v) => {
        const votes = v.unwrap();
        const ayes = votes.ayes.map((who) => this._Accounts.fromAddress(who.toString()));
        const nays = votes.nays.map((who) => this._Accounts.fromAddress(who.toString()));
        this._updateVotes(ayes, nays);
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
  public submitVoteTx(vote: BinaryVote<SubstrateCoin>, cb?) {
    // TODO: check council status
    return this._Chain.createTXModalData(
      vote.account as SubstrateAccount,
      (api: ApiRx) => api.tx.council.vote(this.data.hash, this.data.index, vote.choice),
      'voteCouncilMotions',
      this.title,
      cb,
    );
  }
}
