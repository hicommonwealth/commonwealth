import _ from 'underscore';
import { takeWhile } from 'rxjs/operators';
import { Unsubscribable } from 'rxjs';
import BN from 'bn.js';
import { ApiRx } from '@polkadot/api';
import { Vec } from '@polkadot/types';
import { ITuple } from '@polkadot/types/types';
import { AccountId, BalanceOf } from '@polkadot/types/interfaces';
import { isFunction } from '@polkadot/util';
import { ISubstrateDemocracyProposal, SubstrateCoin, formatCall } from 'adapters/chain/substrate/types';
import { formatProposalHashShort } from 'helpers';
import {
  Proposal, ProposalStatus, ProposalEndTime, DepositVote,
  VotingType, VotingUnit, ChainBase, Account, ChainEntity, ChainEvent
} from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateDemocracyProposals from './democracy_proposals';

const backportEventToAdapter = (
  ChainInfo: SubstrateChain,
  event: SubstrateTypes.IDemocracyProposed,
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

class SubstrateDemocracyProposal extends Proposal<
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

  public readonly hash: string;

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

  public get blockExplorerLink() {
    const chainInfo = this._Chain.app.chain?.meta?.chain;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) {
      const subdomain = blockExplorerIds['subscan'];
      return `https://${subdomain}.subscan.io/democracy_proposal/${this.identifier}`;
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
    return `https://polkadot.js.org/apps/?rpc=${rpcUrl}#/democracy`;
  }

  public get votingInterfaceLinkLabel() {
    return 'Vote on polkadot-js';
  }

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
        .find(
          (e) => e.data.kind === SubstrateTypes.EventKind.DemocracyProposed
        ).data as SubstrateTypes.IDemocracyProposed
    ));
    const eventData = entity.chainEvents
      .find(
        (e) => e.data.kind === SubstrateTypes.EventKind.DemocracyProposed
      ).data as SubstrateTypes.IDemocracyProposed;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Proposals = Proposals;
    this.deposit = this._Chain.coins(new BN(eventData.deposit, 10));
    this._author = this._Accounts.fromAddress(eventData.proposer);
    this.hash = eventData.proposalHash;
    this.createdAt = entity.createdAt;
    // see if preimage exists and populate data if it does
    const preimage = this._Proposals.app.chain.chainEntities.getPreimage(eventData.proposalHash);
    if (preimage) {
      this._method = preimage.method;
      this._section = preimage.section;
      this._title = formatCall(preimage);
    } else {
      this._title = `Proposal ${formatProposalHashShort(eventData.proposalHash)}`;
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
      case SubstrateTypes.EventKind.DemocracyProposed: {
        break;
      }
      case SubstrateTypes.EventKind.DemocracySeconded: {
        const acct = this._Accounts.fromAddress(e.data.who);
        const vote = new DepositVote(acct, this._Chain.coins(this.data.deposit));
        this.addOrUpdateVote(vote);
        break;
      }
      case SubstrateTypes.EventKind.DemocracyTabled: {
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.PreimageNoted: {
        const preimage = this._Proposals.app.chain.chainEntities.getPreimage(this.hash);
        if (preimage) {
          this._method = preimage.method;
          this._section = preimage.section;
          this._title = formatCall(preimage);
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
        const depositorsTuple: ITuple<[ BalanceOf | Vec<AccountId>, BalanceOf | Vec<AccountId> ]> = depositOpt.unwrap();
        let depositors: Vec<AccountId>;
        if (isFunction((depositorsTuple[1] as BalanceOf).mul)) {
          depositors = depositorsTuple[0] as Vec<AccountId>;
        } else {
          depositors = depositorsTuple[1] as Vec<AccountId>;
        }
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
  public submitVoteTx(vote: DepositVote<SubstrateCoin>, cb?) {
    // deposit parameter is ignored

    // handle differing versions of substrate API
    const txFunc = (api: ApiRx) => {
      if ((api.tx.democracy.second as any).meta.args.length === 2) {
        return api.tx.democracy.second(this.data.index, this.getVoters().length);
      } else {
        return (api.tx.democracy.second as any)(this.data.index);
      }
    };
    return this._Chain.createTXModalData(
      vote.account as SubstrateAccount,
      txFunc,
      'secondDemocracyProposal',
      this.title,
      cb
    );
  }
}

export default SubstrateDemocracyProposal;
