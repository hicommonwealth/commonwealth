import { switchMap, first, takeUntil, takeWhile } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { BlockNumber, BalanceOf, Balance } from '@polkadot/types/interfaces';

import { IEdgewareSignalingProposal, IEdgewareSignalingProposalState } from 'adapters/chain/edgeware/types';
import { EdgewareSignalingProposalAdapter } from 'adapters/chain/edgeware/subscriptions';
import { Account,
  Proposal,
  ProposalStatus,
  ProposalEndTime,
  IVote,
  VotingType,
  VotingUnit,
  ProposalModule,
  ChainClass
} from 'models';
import { default as SubstrateChain } from 'controllers/chain/substrate/shared';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import { ProposalStore } from 'stores';
import { BehaviorSubject } from 'rxjs';
import { SubstrateCoin } from 'shared/adapters/chain/substrate/types';
import { VoteOutcome } from 'edgeware-node-types/dist';

export enum SignalingProposalStage {
  PreVoting = 'prevoting',
  Voting = 'voting',
  Completed = 'completed',
}

function getStage(stage) {
  if (stage === 'prevoting') {
    return SignalingProposalStage.PreVoting;
  } else if (stage === 'voting') {
    return SignalingProposalStage.Voting;
  } else if (stage === 'completed') {
    return SignalingProposalStage.Completed;
  } else {
    throw new Error('invalid stage');
  }
}

class EdgewareSignaling extends ProposalModule<
  ApiRx,
  IEdgewareSignalingProposal,
  IEdgewareSignalingProposalState,
  EdgewareSignalingProposal,
  EdgewareSignalingProposalAdapter
> {
  // How many EDG are bonded in reserve to create a signaling proposal.
  // The bond is returned after voting is moved to the 'completed' stage.
  private _proposalBond: SubstrateCoin = null;
  get proposalBond() {
    return this._proposalBond;
  }

  // The number of blocks signaling proposals are in voting for.
  private _votingPeriod: number = null;
  get votingPeriod() {
    return this._votingPeriod;
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    return new Promise((resolve, reject) => {
      this._adapter = new EdgewareSignalingProposalAdapter();
      this._Chain.api.pipe(
        switchMap((api: ApiRx) => api.queryMulti([
          api.query.signaling.proposalCreationBond,
          api.query.signaling.votingLength,
        ])),
        first(),
      ).subscribe(([proposalcreationbond, votinglength]: [BalanceOf, BlockNumber]) => {
        // save parameters
        this._votingPeriod = +votinglength;
        this._proposalBond = this._Chain.coins(proposalcreationbond as Balance);

        this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
          this.initSubscription(
            api,
            (ps) => ps.map((p) => new EdgewareSignalingProposal(ChainInfo, Accounts, this, p))
          ).then(() => {
            this._initialized = true;
            resolve();
          }).catch((err) => {
            reject(err);
          });
        });
      },
      (err) => reject(new Error(err)));
    });
  }

  public createTx(
    author: SubstrateAccount,
    title: string,
    description: string,
    voteOutcomes: any[] = [0, 1],
    voteType: string = 'binary',
    tallyType: string = 'onecoin',
  ) {
    const vOutcomes = (voteOutcomes.length >= 2)
      ? voteOutcomes.map((o) => this._Chain.createType('VoteOutcome', o))
      : null;
    const vType = (voteType === 'binary' || voteType === 'multioption' || voteType === 'rankedchoice')
      ? this._Chain.createType('VoteType', voteType)
      : null;
    const tType = (tallyType === 'onecoin' || tallyType === 'oneperson')
      ? this._Chain.createType('TallyType', tallyType)
      : null;
    if (!vOutcomes || !vType || !tType) return;
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.signaling.createProposal(title, description, vOutcomes, vType, tType),
      'createSignalingProposal',
      title
    );
  }
  public advance(author: SubstrateAccount, proposal: EdgewareSignalingProposal) {
    if (proposal.stage === SignalingProposalStage.Completed) {
      throw new Error('Proposal already completed');
    }
    if (proposal.data.author !== author.address) {
      throw new Error('Only the original author can advance the proposal');
    }
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.signaling.advanceProposal(proposal.data.hash),
      'advanceSignalingProposal',
      proposal.title
    );
  }
}

export default EdgewareSignaling;

export class SignalingVote implements IVote<SubstrateCoin> {
  public readonly account: SubstrateAccount;
  public readonly choices: VoteOutcome[];
  private _balance: SubstrateCoin;
  public get balance(): SubstrateCoin { return this._balance; }

  constructor(proposal: EdgewareSignalingProposal, account: SubstrateAccount, choices: VoteOutcome[]) {
    this.account = account;
    this.choices = choices;
    this.account.balance.pipe(takeWhile(() => !proposal.completed)).subscribe((bal) => this._balance = bal);
  }
}

export class EdgewareSignalingProposal
extends Proposal<ApiRx, SubstrateCoin, IEdgewareSignalingProposal, IEdgewareSignalingProposalState, SignalingVote> {
  public get shortIdentifier() {
    return '#' + this.data.voteIndex.toString();
  }
  public get title() { return this.data.title; }
  public get description() { return this.data.description; }
  public get author() { return this.data.author ? this._Accounts.fromAddress(this.data.author) : null; }

  public get support() {
    // TODO: support multi-option votes
    // TODO: support ranked-choice votes
    // TODO: support 1p1v
    if (this.getVotes().some((v) => v.balance === undefined)) {
      // balances haven't resolved yet!
      console.error('Balances haven\'t resolved');
      return 0;
    }
    const yesVotes = this.getVotes()
      .filter((vote) =>
        vote.choices.length === 1 && vote.choices[0].toHex() === this._Chain.createType('VoteOutcome', [1]).toHex());
    const noVotes = this.getVotes()
      .filter((vote) =>
        vote.choices.length === 1 && vote.choices[0].toHex() === this._Chain.createType('VoteOutcome', [0]).toHex());
    if (yesVotes.length === 0 && noVotes.length === 0) return 0;

    const yesSupport = yesVotes.reduce(((total, vote) => vote.balance.inDollars + total), 0);
    const noSupport = noVotes.reduce(((total, vote) => vote.balance.inDollars + total), 0);
    return yesSupport / (yesSupport + noSupport);
  }
  public get turnout() {
    if (this.getVotes().some((v) => v.balance === undefined)) {
      // balances haven't resolved yet!
      console.error('Balances haven\'t resolved');
      return 0;
    }
    const totalWeight = this.getVotes().reduce((total, vote) =>
      this._Chain.coins(vote.balance.add(total)), this._Chain.coins(0));
    return totalWeight.inDollars / this._Chain.totalbalance.inDollars;
  }

  public get votingType() {
    // TODO: support ranked-choice votes
    return (this.data.voteType.toString() === 'binary')
      ? VotingType.SimpleYesNoVoting // TODO: generalize this to what the options are
      : (this.data.voteType.toString() === 'multioption')
      ? VotingType.MultiOptionVoting
      : VotingType.RankedChoiceVoting;
  }
  public get votingUnit() {
    return VotingUnit.CoinVote;
  }
  public canVoteFrom(account : Account<any>) {
    return account.chainClass === ChainClass.Edgeware;
  }
  get isPassing() {
    return ProposalStatus.None;
  }

  private _stage: BehaviorSubject<SignalingProposalStage> = new BehaviorSubject(SignalingProposalStage.PreVoting);
  get stage() {
    return this._stage.getValue();
  }

  private _endBlock: BehaviorSubject<number> = new BehaviorSubject(undefined);
  get endTime(): ProposalEndTime {
    return this.completed ? { kind: 'unavailable' } :
      this._endBlock.getValue() ? { kind: 'fixed_block', blocknum: this._endBlock.getValue() } :
      { kind: 'not_started' };
  }

  // CONSTRUCTOR
  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Signaling: EdgewareSignaling;

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Signaling: EdgewareSignaling,
    data: IEdgewareSignalingProposal
  ) {
    super('signalingproposal', data);
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Signaling = Signaling;
    this.subscribe(
      this._Chain.api,
      this._Signaling.store,
      this._Signaling.adapter
    );
    this._Signaling.store.add(this);
  }

  public submitVoteTx(vote: SignalingVote) {
    if (this.stage !== SignalingProposalStage.Voting) {
      throw new Error('Proposal not in voting stage');
    }
    if (vote.choices.find((p) => !this.data.choices.map((d) => d.toHex()).includes(p.toHex()))) {
      throw new Error('invalid choice in vote');
    }
    if (this.data.voteType.toString() === 'RankedChoice') {
      if (vote.choices.length !== this.data.choices.length) {
        throw new Error('must provide rankings for all choices');
      }
    } else {
      if (vote.choices.length !== 1) {
        throw new Error('can only vote for one option');
      }
    }
    return this._Chain.createTXModalData(
      vote.account,
      (api: ApiRx) => api.tx.voting.reveal(this.data.voteIndex, vote.choices, null),
      'submitSignalingVote',
      this.title
    );
  }

  protected updateState(store: ProposalStore<EdgewareSignalingProposal>, state: IEdgewareSignalingProposalState) {
    for (const voter of Object.keys(state.votes)) {
      const acct = this._Accounts.fromAddress(voter);
      this.addOrUpdateVote(new SignalingVote(this, acct, state.votes[voter]));
    }
    this._endBlock.next(state.endBlock === 0 ? undefined : state.endBlock);
    this._stage.next(getStage(state.stage));
    super.updateState(store, state);
  }
}
