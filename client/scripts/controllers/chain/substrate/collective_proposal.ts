import _ from 'underscore';

import { SubstrateTypes } from '@commonwealth/chain-events';
import { ApiPromise } from '@polkadot/api';
import { Votes } from '@polkadot/types/interfaces';
import { Option } from '@polkadot/types';

import { ISubstrateCollectiveProposal, SubstrateCoin, formatCall } from 'adapters/chain/substrate/types';
import {
  Proposal, ProposalStatus, ProposalEndTime, BinaryVote, VotingType,
  VotingUnit, ChainEntity, ChainEvent
} from 'models';
import { ProposalType } from 'types';
import { chainEntityTypeToProposalSlug } from 'identifiers';

import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateCollective from './collective';
import { SubstrateDemocracyReferendum } from './democracy_referendum';
import Substrate from './main';

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
  ApiPromise, SubstrateCoin, ISubstrateCollectiveProposal, SubstrateCollectiveVote
> {
  public get shortIdentifier() {
    return `#${this.data.index.toString()}`;
  }
  public get description() { return null; }
  public get author() { return null; }
  public get call() { return this._call; }

  // MEMBERS
  public canVoteFrom(account: SubstrateAccount) {
    return this._Collective.isMember(account);
  }
  public title: string;
  private readonly _call;
  private _approved: boolean = false;

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Collective: SubstrateCollective;
  public get collectiveName(): string {
    return this._Collective.moduleName;
  }

  // BLOCK EXPLORER LINK
  public get blockExplorerLink() {
    const chainInfo = this._Chain.app.chain?.meta;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) {
      const subdomain = blockExplorerIds['subscan'];
      return `https://${subdomain}.subscan.io/council/${this.identifier}`;
    } else {
      return undefined;
    }
  }

  public get blockExplorerLinkLabel() {
    const chainInfo = this._Chain.app.chain?.meta;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) return 'View in Subscan';
    return undefined;
  }

  public get votingInterfaceLink() {
    const rpcUrl = encodeURIComponent(this._Chain.app.chain?.meta?.node.url);
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
    super(ProposalType.SubstrateCollectiveProposal, backportEventToAdapter(
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
    this._call = eventData.call;
    this.title = entity.title || formatCall(eventData.call);
    this.createdAt = entity.createdAt;
    this.threadId = entity.threadId;
    this.threadTitle = entity.threadTitle;

    entity.chainEvents.forEach((e) => this.update(e));

    if (!this._completed) {
      const slug = chainEntityTypeToProposalSlug(entity.type);
      const uniqueId = `${slug}_${entity.typeId}`;
      this._Chain.app.chain.chainEntities._fetchTitle(entity.chain, uniqueId).then((response) => {
        if (response.status === 'Success' && response.result?.length) {
          this.title = response.result;
        }
      });
      this._initialized = true;
      this.updateVoters();
      this._Collective.store.add(this);
    } else {
      this._initialized = true;
      this.updateVoters();
      this._Collective.store.add(this);
    }
  }

  protected complete() {
    super.complete(this._Collective.store);
  }

  // Attempts to find the Referendum produced by this Collective Proposal by
  //   searching for the same proposal hash.
  // NOTE: for full functionality, "referendum" module must be loaded.
  // TODO: This may cause issues if we have the same Call proposed twice, as this will only fetch the
  //   first one in storage. To fix this, we will need to use some timing heuristics to check that
  //   this referendum was created approximately when the found proposal concluded.
  public getReferendum(): SubstrateDemocracyReferendum | undefined {
    // ensure all modules have loaded
    if (!this._Chain.app.isModuleReady) return;

    // search for same preimage/proposal hash
    const chain = (this._Chain.app.chain as Substrate);
    const referendum = chain.democracy?.store.getAll().find((p) => {
      return p.hash === this.data.hash;
    });
    if (referendum) return referendum;

    return undefined;
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
        this._approved = false;
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.CollectiveApproved: {
        this._approved = true;
        break;
      }
      case SubstrateTypes.EventKind.CollectiveExecuted: {
        if (!this._approved) {
          this._approved = true;
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

  public updateVoters = async () => {
    const v = await this._Chain.api.query[this.collectiveName].voting<Option<Votes>>(this.data.hash);
    if (v.isSome) {
      const votes = v.unwrap();
      this.clearVotes();
      votes.ayes.map(
        (who) => this.addOrUpdateVote(
          new SubstrateCollectiveVote(this, this._Accounts.fromAddress(who.toString()), true)
        )
      );
      votes.nays.map(
        (who) => this.addOrUpdateVote(
          new SubstrateCollectiveVote(this, this._Accounts.fromAddress(who.toString()), false)
        )
      );
    }
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
      return this._approved
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
    return this._approved;
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
      (api: ApiPromise) => api.tx.council.vote(this.data.hash, this.data.index, vote.choice),
      'voteCouncilMotions',
      this.title,
      cb,
    );
  }
}
