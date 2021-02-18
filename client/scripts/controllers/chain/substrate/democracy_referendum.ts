import { ApiPromise } from '@polkadot/api';
import { Call, Conviction } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import {
  ISubstrateDemocracyReferendum,
  SubstrateCoin,
  DemocracyThreshold,
  formatCall,
} from 'adapters/chain/substrate/types';
import {
  Proposal, ProposalStatus, ProposalEndTime, BinaryVote, VotingType, VotingUnit,
  ChainBase, Account, ChainEntity, ChainEvent
} from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import { BehaviorSubject } from 'rxjs';
import { Coin } from 'adapters/currency';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateDemocracy from './democracy';

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

export class SubstrateDemocracyVote extends BinaryVote<SubstrateCoin> {
  public readonly balance: SubstrateCoin;

  constructor(
    proposal: SubstrateDemocracyReferendum,
    account: SubstrateAccount,
    choice: boolean,
    balance: SubstrateCoin,
    weight: number
  ) {
    super(account, choice, null, weight);
    this.balance = balance;
  }

  public get coinWeight(): Coin {
    // handle case where an invalid vote was pushed on chain
    if (this.weight === undefined) return new Coin(this.balance.denom, 0);
    return this.weight < 1
      ? new Coin(this.balance.denom, this.balance.divn(1 / this.weight))
      : new Coin(this.balance.denom, this.balance.muln(this.weight));
  }
}

const backportEventToAdapter = (event: SubstrateTypes.IDemocracyStarted): ISubstrateDemocracyReferendum => {
  const enc = new TextEncoder();
  return {
    identifier: event.referendumIndex.toString(),
    index: event.referendumIndex,
    endBlock: event.endBlock,
    threshold: event.voteThreshold as DemocracyThreshold,
    hash: enc.encode(event.proposalHash),
  };
};

export class SubstrateDemocracyReferendum
  extends Proposal<
  ApiPromise, SubstrateCoin, ISubstrateDemocracyReferendum, SubstrateDemocracyVote
> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }
  public get title() { return this._title; }
  public get description() { return null; }
  public get author() { return null; }
  public get preimage() { return this._preimage; }

  public get votingType() {
    return VotingType.ConvictionYesNoVoting;
  }
  public get votingUnit() {
    return VotingUnit.CoinVote;
  }
  public canVoteFrom(account: Account<any>) {
    return account.chainBase === ChainBase.Substrate;
  }
  private _title: string;
  private _preimage;
  private _endBlock: number;
  public readonly hash: string;

  private _passed: boolean;
  public get passed() { return this._passed; }

  private _executionBlock: number;
  public get executionBlock() { return this._executionBlock; }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Democracy: SubstrateDemocracy;

  // BLOCK EXPLORER LINK
  public get blockExplorerLink() {
    const chainInfo = this._Chain.app.chain?.meta?.chain;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) {
      const subdomain = blockExplorerIds['subscan'];
      return `https://${subdomain}.subscan.io/referenda/${this.identifier}`;
    }
    return undefined;
  }

  public get blockExplorerLinkLabel() {
    const chainInfo = this._Chain.app.chain?.meta?.chain;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) return 'View in Subscan';
    return undefined;
  }

  public get votingInterfaceLink() {
    const rpcUrl = encodeURIComponent(this._Chain.app.chain?.meta?.url);
    return `https://polkadot.js.org/apps/?rpc=${rpcUrl}#/democracy`;
  }

  public get votingInterfaceLinkLabel() {
    return 'Vote on polkadot-js';
  }

  // CONSTRUCTORS
  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Democracy: SubstrateDemocracy,
    entity: ChainEntity,
  ) {
    super('referendum', backportEventToAdapter(
      entity.chainEvents
        .find(
          (e) => e.data.kind === SubstrateTypes.EventKind.DemocracyStarted
        ).data as SubstrateTypes.IDemocracyStarted
    ));

    const eventData = entity.chainEvents
      .find(
        (e) => e.data.kind === SubstrateTypes.EventKind.DemocracyStarted
      ).data as SubstrateTypes.IDemocracyStarted;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Democracy = Democracy;
    this._endBlock = this.data.endBlock;
    this.hash = eventData.proposalHash;
    this.createdAt = entity.createdAt;

    // see if preimage exists and populate data if it does
    const preimage = this._Democracy.app.chain.chainEntities.getPreimage(eventData.proposalHash);
    if (preimage) {
      this._preimage = preimage;
      this._title = formatCall(preimage);
    } else {
      this._title = `Referendum #${this.data.index}`;
    }

    // handle events params for passing, if exists at init time
    entity.chainEvents.forEach((e) => this.update(e));

    this._initialized.next(true);
    this._initVoters();
    this._Democracy.store.add(this);
  }

  protected complete() {
    super.complete(this._Democracy.store);
  }

  public update(e: ChainEvent) {
    if (this.completed) {
      return;
    }
    switch (e.data.kind) {
      case SubstrateTypes.EventKind.DemocracyStarted: {
        break;
      }
      case SubstrateTypes.EventKind.DemocracyVoted: {
        const { who, isAye, conviction, balance } = e.data;
        const vote = new SubstrateDemocracyVote(
          this,
          this._Accounts.fromAddress(who),
          isAye,
          this._Chain.coins(new BN(balance)),
          convictionToWeight(conviction),
        );
        this.addOrUpdateVote(vote);
        break;
      }
      case SubstrateTypes.EventKind.DemocracyCancelled:
      case SubstrateTypes.EventKind.DemocracyNotPassed: {
        this._passed = false;
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.DemocracyPassed: {
        this._passed = true;
        this._executionBlock = e.data.dispatchBlock;
        this._endBlock = e.data.dispatchBlock; // fix timer if in dispatch queue

        // hack to complete proposals that didn't get an execution event for some reason
        if (this._executionBlock < this._Democracy.app.chain.block.height) {
          this.complete();
        }
        break;
      }
      case SubstrateTypes.EventKind.DemocracyExecuted: {
        if (!this.passed) {
          this._passed = true;
        }
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.PreimageNoted: {
        const preimage = this._Democracy.app.chain.chainEntities.getPreimage(this.hash);
        if (preimage) {
          this._preimage = preimage;
          this._title = formatCall(preimage);
        }
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
  }

  private async _initVoters() {
    const referenda = await this._Chain.api.derive.democracy.referendumsInfo([ new BN(this.data.index) ]);
    if (referenda?.length) {
      const votes = await this._Chain.api.derive.democracy._referendumVotes(referenda[0]);
      for (const { accountId, balance, vote } of votes.votes) {
        const acct = this._Accounts.fromAddress(accountId.toString());
        if (!this.hasVoted(acct)) {
          this.addOrUpdateVote(new SubstrateDemocracyVote(
            this, acct, vote.isAye, this._Chain.coins(balance), convictionToWeight(vote.conviction.index)
          ));
        }
      }
    }
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
    if (this._passed) return ProposalStatus.Passed;
    if (this.completed === true && !this._passed) return ProposalStatus.Failed;
    if (this._Chain.totalbalance.eqn(0)) return ProposalStatus.None;
    if (this.edgVoted.eqn(0)) return ProposalStatus.Failing;

    // TODO double check + verify numeric computation
    let passing;
    switch (this.data.threshold) {
      case DemocracyThreshold.Supermajorityapproval:
        passing = this.edgVotedYes.sqr().div(this._Chain.totalbalance).gt(
          this.edgVotedNo.sqr().div(this.edgVoted)
        );
        break;

      case DemocracyThreshold.Supermajorityrejection:
        passing = this.edgVotedYes.sqr().div(this.edgVoted).gt(
          this.edgVotedNo.sqr().div(this._Chain.totalbalance)
        );
        break;

      case DemocracyThreshold.Simplemajority:
        passing = this.edgVotedYes.gt(this.edgVotedNo);
        break;

      default:
        throw new Error(`invalid threshold field: ${this.data.threshold}`);
    }
    return passing ? ProposalStatus.Passing : ProposalStatus.Failing;
  }

  // TRANSACTIONS
  // TODO: allow the user to enter how much balance they want to vote with
  public async submitVoteTx(vote: BinaryVote<SubstrateCoin>, cb?) {
    const conviction = convictionToSubstrate(this._Chain, weightToConviction(vote.weight)).index;

    // fake the arg to compute balance
    const balance = await (vote.account as SubstrateAccount).freeBalance;

    // "AccountVote" type, for kusama
    // we don't support "Split" votes right now
    const srmlVote = {
      Standard: {
        vote: {
          aye: vote.choice,
          conviction,
        },
        balance: balance.toString(),
      }
    };

    // even though voting balance is specifiable, we pre-populate the voting balance as "all funds"
    //   to align with old voting behavior -- we should change this soon.
    // TODO: move this computation out into the view as needed, to prepopulate field
    const fees = await this._Chain.computeFees(
      vote.account.address,
      (api: ApiPromise) => api.tx.democracy.vote(this.data.index, srmlVote)
    );

    srmlVote.Standard.balance = balance.sub(fees).toString();

    return this._Chain.createTXModalData(
      vote.account as SubstrateAccount,
      (api: ApiPromise) => api.tx.democracy.vote(this.data.index, srmlVote),
      'submitDemocracyVote',
      this.title,
      cb
    );
  }

  public unvote(who: SubstrateAccount, target?: SubstrateAccount) {
    // you can remove someone else's vote if their unvote scope is set properly,
    // but we don't support that in the UI right now (it requires their vote
    // to be "expired", or for the proxy configuration to allow removing their vote)
    if (!target) {
      target = who;
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiPromise) => api.tx.democracy.removeOtherVote(target.address, this.data.index),
      'unvote',
      `${who.address} unvotes for ${target.address} on referendum ${this.data.index}`,
    );
  }

  // public async proxyVoteTx(vote: BinaryVote<SubstrateCoin>) {
  //   const proxyFor = await (vote.account as SubstrateAccount).proxyFor.pipe(first()).toPromise();
  //   if (!proxyFor) {
  //     throw new Error('not a proxy');
  //   }
  //   const srmlVote = this._Chain.createType('Vote', {
  //     aye: vote.choice,
  //     conviction: convictionToSubstrate(this._Chain, weightToConviction(vote.weight)),
  //   });
  //   return this._Chain.createTXModalData(
  //     vote.account as SubstrateAccount,
  //     (api: ApiPromise) => api.tx.democracy.proxyVote(this.data.index, srmlVote),
  //     'submitProxyDemocracyVote',
  //     this.title
  //   );
  // }

  public async notePreimage(author: SubstrateAccount, action: Call) {
    const txFunc = (api: ApiPromise) => api.tx.democracy.notePreimage(action.toHex());
    return this._Chain.createTXModalData(
      author,
      txFunc,
      'notePreimage',
      this._Chain.methodToTitle(action),
    );
  }

  public noteImminentPreimage(author: SubstrateAccount, action: Call) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.democracy.noteImminentPreimage(action.toHex()),
      'noteImminentPreimage',
      this._Chain.methodToTitle(action),
    );
  }
}
