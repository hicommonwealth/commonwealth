import { switchMap, takeWhile, first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { Call, VoteThreshold, AccountId } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import {
  ISubstrateCollectiveProposal, ISubstrateCollectiveProposalState, SubstrateCoin
} from 'adapters/chain/substrate/types';
import { SubstrateCollectiveAdapter } from 'adapters/chain/substrate/subscriptions';
import { Proposal, ProposalStatus, ProposalEndTime, BinaryVote, VotingType, VotingUnit, ProposalModule } from 'models/models';
import { default as SubstrateChain } from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { ProposalStore } from 'models/stores';
import { Unsubscribable, BehaviorSubject } from 'rxjs';
import { Vec, GenericCall } from '@polkadot/types';
import { CallFunction } from '@polkadot/types/types';

class SubstrateCollective extends ProposalModule<
  ApiRx,
  ISubstrateCollectiveProposal,
  ISubstrateCollectiveProposalState,
  SubstrateCollectiveProposal,
  SubstrateCollectiveAdapter
> {
  private _memberSubscription: Unsubscribable; // init in each overriden init() call
  private _members: SubstrateAccount[];
  public get members() { return this._members; }
  public isMember(account: SubstrateAccount): boolean {
    return this._members.find((m) => m.address === account.address) !== undefined;
  }

  private _moduleName: string;
  public get moduleName() { return this._moduleName; }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  // TODO: we may want to track membership here as well as in elections
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts, moduleName: string): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._moduleName = moduleName;
    return new Promise((resolve, reject) => {
      this._adapter = new SubstrateCollectiveAdapter(moduleName);
      this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
        const memberP = new Promise((memberResolve) => {
          this._memberSubscription = api.query[moduleName].members()
          .subscribe((members: Vec<AccountId>) => {
            this._members = members.toArray().map((v) => this._Accounts.fromAddress(v.toString()));
            memberResolve();
          });
        });

        const subP = this.initSubscription(
          api,
          (ps) => ps.map((p) => new SubstrateCollectiveProposal(ChainInfo, Accounts, this, p))
        );

        Promise.all([subP, memberP]).then(() => {
          this._initialized = true;
          resolve();
        }).catch((err) => {
          reject(err);
        });
      })
    });
  }

  public createEmergencyCancellation(author: SubstrateAccount, threshold: number, referendumId: number) {
    const func = this._Chain.getTxMethod('democracy', 'emergencyCancel');
    return this.createTx(author, threshold, func(referendumId).method);
  }
  public vetoNextExternal(author: SubstrateAccount, hash: string) {
    const func = this._Chain.getTxMethod('democracy', 'vetoExternal');
    return this.createTx(author, 1, func(hash).method);
  }
  public createTreasuryApprovalMotion(author: SubstrateAccount, threshold: number, treasuryIdx: number) {
    const func = this._Chain.getTxMethod('treasury', 'approveProposal');
    return this.createTx(author, threshold, func(treasuryIdx).method);
  }
  public createTreasuryRejectionMotion(author: SubstrateAccount, threshold: number, treasuryIdx: number) {
    const func = this._Chain.getTxMethod('treasury', 'rejectProposal');
    return this.createTx(author, threshold, func(treasuryIdx).method);
  }
  public createExternalProposal(author: SubstrateAccount, threshold: number, action: Call) {
    const func = this._Chain.getTxMethod('democracy', 'externalPropose');
    return this.createTx(author, threshold, func(action.hash).method);
  }
  public createExternalProposalMajority(author: SubstrateAccount, threshold: number, action: Call) {
    const func = this._Chain.getTxMethod('democracy', 'externalProposeMajority');
    return this.createTx(author, threshold, func(action.hash).method);
  }
  public createExternalProposalDefault(author: SubstrateAccount, threshold: number, action: Call) {
    // only on kusama
    const func = this._Chain.getTxMethod('democracy', 'externalProposeDefault');
    return this.createTx(author, threshold, func(action.hash).method);
  }
  public createFastTrack(
    author: SubstrateAccount,
    threshold: number,
    hash: string,
    votingPeriod: number,
    delay: number
  ) {
    // only on kusama
    // TODO: we must check if Instant is allowed and if
    // votingPeriod is valid wrt FastTrackVotingPeriod
    const func = (this._Chain.getTxMethod('democracy', 'fastTrack'));
    return this.createTx(
      author,
      threshold,
      func(hash, votingPeriod, delay).method
    );
  }

  public createTx(author: SubstrateAccount, threshold: number, action: Call, fromTechnicalCommittee?: boolean) {
    // TODO: check council status
    const title = this._Chain.methodToTitle(action);
    const txFunc = fromTechnicalCommittee ?
      ((api: ApiRx) => api.tx.technicalCommittee.propose(threshold, action)) :
      ((api: ApiRx) => api.tx.council.propose(threshold, action));
    return this._Chain.createTXModalData(
      author,
      txFunc,
      'createCouncilMotion',
      title
    );
  }

  public deinit() {
    if (this._memberSubscription) {
      this._memberSubscription.unsubscribe();
    }
    super.deinit();
  }
}

export class SubstrateCouncil extends SubstrateCollective {
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    return super.init(ChainInfo, Accounts, 'council');
  }
}

export class SubstrateTechnicalCommittee extends SubstrateCollective {
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    return super.init(ChainInfo, Accounts, 'technicalCommittee');
  }
}

export default SubstrateCollective;

export class SubstrateCollectiveVote extends BinaryVote<SubstrateCoin> {
  private _balance: SubstrateCoin;
  public get balance(): SubstrateCoin { return this._balance; }

  constructor(proposal: SubstrateCollectiveProposal, account: SubstrateAccount, choice: boolean) {
    super(account, choice);
    this.account.balance.pipe(takeWhile(() => !proposal.completed)).subscribe((bal) => this._balance = bal);
  }
}

export class SubstrateCollectiveProposal
extends Proposal<
  ApiRx, SubstrateCoin, ISubstrateCollectiveProposal, ISubstrateCollectiveProposalState, SubstrateCollectiveVote
> {
  public get shortIdentifier() {
    return '#' + this.data.index.toString();
  }
  public get title() { return this._title; }
  public get description() { return null; }
  public get author() { return null; }

  // MEMBERS
  public canVoteFrom(account: SubstrateAccount) {
    return this._Collective.isMember(account);
  }
  public canCreateFrom(account: SubstrateAccount) {
    return this._Collective.isMember(account);
  }
  private readonly _title: string;
  public readonly method: Call;
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
    data: ISubstrateCollectiveProposal
  ) {
    super('councilmotion', data);
    this.method = ChainInfo.findCall(data.method.callIndex)(...data.method.args);
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Collective = Collective;
    this._title = this._Chain.methodToTitle(data.method);
    this.subscribe(
      this._Chain.api,
      this._Collective.store,
      this._Collective.adapter
    );
    this._Collective.store.add(this);
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
      return this._approved.getValue() ?
        ProposalStatus.Passed :
        ProposalStatus.Failed;
    }
    return (this.accountsVotedYes.length >= this.data.threshold) ?
      ProposalStatus.Passing :
      ProposalStatus.Failing;
  }
  get endTime() : ProposalEndTime {
    return { kind: 'threshold', threshold: this.data.threshold };
  }

  public get support() {
    return this.accountsVotedYes.length + this.accountsVotedNo.length === 0 ?
      0 : this.accountsVotedYes.length / (this.accountsVotedYes.length + this.accountsVotedNo.length);
  }
  public get turnout() {
    return this._Collective.members.length === 0 ?
      0 : (this.accountsVotedYes.length + this.accountsVotedNo.length) / this._Collective.members.length;
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
        description: 'Introduces a council proposal. Requires approval from 1/2 of councillors, after which ' +
          'it turns into a supermajority-required referendum.',
      }, {
        name: 'createExternalProposalMajority',
        label: 'Create majority-approval council proposal (2/3 councillors, majority public approval)',
        description: 'Introduces a council proposal. Requires approval from 2/3 of councillors, after which ' +
          'it turns into a 50% approval referendum.',
      // createExternalProposalDefault and createFastTrack not supported on edgeware
      // XXX: support on Kusama
      //}, {
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
        description: 'Cancels an active referendum. If reintroduced, the referendum cannot be canceled again. ' +
          'Requires approval from 2/3 of councillors.',
      }, {
        name: 'vetoNextExternal',
        label: 'Veto next external proposal',
        description: 'Vetoes a council proposal. If reintroduced after the cooldown period, ' +
          'the same councillor cannot veto the proposal again.',
      }, {
        name: 'createTreasuryApprovalMotion',
        label: 'Approve treasury proposal',
        description: 'Approves a treasury proposal. This queues it up to be awarded in the next spend cycle as ' +
          'soon as there are enough treasury funds. Requires approval from 4 councillors.',
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

  protected updateState(store: ProposalStore<SubstrateCollectiveProposal>, state: ISubstrateCollectiveProposalState) {
    for (const voter of Object.keys(state.votes)) {
      const acct = this._Accounts.fromAddress(voter);
      this.addOrUpdateVote(new SubstrateCollectiveVote(this, acct, state.votes[voter]));
    }
    this._approved.next(state.approved);
    super.updateState(store, state);
  }
}
