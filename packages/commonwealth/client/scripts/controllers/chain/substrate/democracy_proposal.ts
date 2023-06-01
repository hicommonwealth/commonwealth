import type { ApiPromise } from '@polkadot/api';
import type { Vec } from '@polkadot/types';
import type { AccountId, BalanceOf } from '@polkadot/types/interfaces';
import type { ITuple } from '@polkadot/types/types';
import { isFunction } from '@polkadot/util';

import type {
  ISubstrateDemocracyProposal,
  SubstrateCoin,
} from 'adapters/chain/substrate/types';
import { formatCall } from 'adapters/chain/substrate/types';
import BN from 'bn.js';

import { SubstrateTypes } from 'chain-events/src/types';
import { ChainBase, ProposalType } from 'common-common/src/types';
import { formatProposalHashShort } from 'helpers';
import type Account from '../../../models/Account';
import type ChainEntity from '../../../models/ChainEntity';
import type ChainEvent from '../../../models/ChainEvent';
import Proposal from '../../../models/Proposal';
import { ProposalStatus, VotingType, VotingUnit } from '../../../models/types';
import type { ProposalEndTime } from '../../../models/types';
import { DepositVote } from '../../../models/votes';
import type SubstrateAccounts from './account';
import type { SubstrateAccount } from './account';
import type Substrate from './adapter';
import type SubstrateDemocracyProposals from './democracy_proposals';
import type { SubstrateDemocracyReferendum } from './democracy_referendum';

import type SubstrateChain from './shared';

const backportEventToAdapter = (
  ChainInfo: SubstrateChain,
  event: SubstrateTypes.IDemocracyProposed
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
  ApiPromise,
  SubstrateCoin,
  ISubstrateDemocracyProposal,
  DepositVote<SubstrateCoin>
> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }

  public title: string;

  public get description() {
    return null;
  }

  private readonly _author: SubstrateAccount;
  public get author() {
    return this._author;
  }

  private _preimage;
  public get preimage() {
    return this._preimage;
  }

  public readonly hash: string;

  public get votingType() {
    return VotingType.SimpleYesApprovalVoting;
  }

  public get votingUnit() {
    return VotingUnit.CoinVote;
  }

  public canVoteFrom(account: Account) {
    return account.chain.base === ChainBase.Substrate;
  }

  public readonly deposit: SubstrateCoin;

  public _method: string;
  get method() {
    return this._method;
  }

  public _section: string;
  get section() {
    return this._section;
  }

  public get support(): SubstrateCoin {
    return this._Chain.coins(
      this.getVotes().reduce(
        (total, vote) => vote.deposit.add(total),
        new BN(0)
      )
    );
  }

  public get turnout() {
    return this.support.inDollars / this._Chain.totalbalance.inDollars;
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Proposals: SubstrateDemocracyProposals;

  public get blockExplorerLink() {
    const chainInfo = this._Chain.app.chain?.meta;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) {
      const subdomain = blockExplorerIds['subscan'];
      return `https://${subdomain}.subscan.io/democracy_proposal/${this.identifier}`;
    }
    return undefined;
  }

  public get blockExplorerLinkLabel() {
    const chainInfo = this._Chain.app.chain?.meta;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan'])
      return 'View in Subscan';
    return undefined;
  }

  public get votingInterfaceLink() {
    const rpcUrl = encodeURIComponent(this._Chain.app.chain?.meta?.node.url);
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
    entity: ChainEntity
  ) {
    // fake adapter data
    super(
      ProposalType.SubstrateDemocracyProposal,
      backportEventToAdapter(
        ChainInfo,
        entity.chainEvents.find(
          (e) => e.data.kind === SubstrateTypes.EventKind.DemocracyProposed
        ).data as SubstrateTypes.IDemocracyProposed
      )
    );
    const eventData = entity.chainEvents.find(
      (e) => e.data.kind === SubstrateTypes.EventKind.DemocracyProposed
    ).data as SubstrateTypes.IDemocracyProposed;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Proposals = Proposals;
    this.deposit = this._Chain.coins(new BN(eventData.deposit, 10));
    this._author = this._Accounts.fromAddress(
      eventData.proposer || entity.author
    );
    this.hash = eventData.proposalHash;
    this.createdAt = entity.createdAt;

    // see if preimage exists and populate data if it does
    const preimage = this._Proposals.app.chainEntities.getPreimage(
      eventData.proposalHash
    );
    if (preimage) {
      this._method = preimage.method;
      this._section = preimage.section;
      this._preimage = preimage;
      this.title = formatCall(preimage);
    } else {
      this.title = `Proposal ${formatProposalHashShort(
        eventData.proposalHash
      )}`;
    }

    entity.chainEvents.forEach((e) => this.update(e));

    this._initialized = true;
    this.updateVoters();
    this._Proposals.store.add(this);
  }

  protected complete() {
    super.complete(this._Proposals.store);
  }

  // Attempts to find the Referendum produced by this Democracy Proposal by
  //   searching for the same proposal hash.
  // NOTE: for full functionality, "referendum" module must be loaded.
  // TODO: This may cause issues if we have the same Call proposed twice, as this will only fetch the
  //   first one in storage. To fix this, we will need to use some timing heuristics to check that
  //   this referendum was created approximately when the found proposal concluded.
  public getReferendum(): SubstrateDemocracyReferendum | undefined {
    // ensure all modules have loaded
    if (!this._Chain.app.isModuleReady) return;

    // search for same preimage/proposal hash
    const chain = this._Chain.app.chain as Substrate;
    const referendum = chain.democracy?.store.getAll().find((p) => {
      return p.hash === this.hash;
    });
    if (referendum) return referendum;

    return undefined;
  }

  public update(e: ChainEvent) {
    switch (e.data.kind) {
      case SubstrateTypes.EventKind.DemocracyProposed: {
        break;
      }
      case SubstrateTypes.EventKind.DemocracySeconded: {
        const acct = this._Accounts.fromAddress(e.data.who);
        const vote = new DepositVote(
          acct,
          this._Chain.coins(this.data.deposit)
        );
        this.addOrUpdateVote(vote);
        break;
      }
      case SubstrateTypes.EventKind.DemocracyTabled: {
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.PreimageNoted: {
        const preimage = this._Proposals.app.chainEntities.getPreimage(
          this.hash
        );
        if (preimage) {
          this._method = preimage.method;
          this._section = preimage.section;
          this._preimage = preimage;
          this.title = this.title || formatCall(preimage);
        }
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
  }

  public updateVoters = async () => {
    const depositOpt = await this._Chain.api.query.democracy.depositOf(
      this.data.index
    );
    if (!depositOpt.isSome) return;
    const depositorsTuple: ITuple<
      [BalanceOf | Vec<AccountId>, BalanceOf | Vec<AccountId>]
    > = depositOpt.unwrap();
    let depositors: Vec<AccountId>;
    if (isFunction((depositorsTuple[1] as BalanceOf).mul)) {
      depositors = depositorsTuple[0] as Vec<AccountId>;
    } else {
      depositors = depositorsTuple[1] as Vec<AccountId>;
    }
    for (const depositor of depositors) {
      const acct = this._Accounts.fromAddress(depositor.toString());
      const votes = this.getVotes(acct);
      if (!votes.length) {
        this.addOrUpdateVote(
          new DepositVote(acct, this._Chain.coins(this.data.deposit))
        );
      } else {
        // if they second a proposal multiple times, sum up the vote weight
        const vote = new DepositVote(
          acct,
          this._Chain.coins(votes[0].deposit.add(this.data.deposit))
        );
        this.addOrUpdateVote(vote);
      }
    }
  };

  // GETTERS AND SETTERS
  get endTime(): ProposalEndTime {
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
    proposals.sort(
      (a: SubstrateDemocracyProposal, b: SubstrateDemocracyProposal) => {
        if (a.support.lt(b.support)) return -1;
        if (a.support.gt(b.support)) return 1;
        if (a.data.index < b.data.index) return -1;
        if (a.data.index > b.data.index) return 1;
        return 0;
      }
    );
    proposals.reverse();
    return this === proposals[0]
      ? ProposalStatus.Passing
      : ProposalStatus.Failing;
  }

  // TRANSACTIONS
  public submitVoteTx(vote: DepositVote<SubstrateCoin>, cb?) {
    // deposit parameter is ignored

    // handle differing versions of substrate API
    const txFunc = (api: ApiPromise) => {
      if ((api.tx.democracy.second as any).meta.args.length === 2) {
        return api.tx.democracy.second(
          this.data.index,
          this.getVoters().length
        );
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
