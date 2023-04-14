import type { ApiPromise } from '@polkadot/api';
import type { ISubstrateTreasuryTip, SubstrateCoin, } from 'adapters/chain/substrate/types';
import BN from 'bn.js';
import { SubstrateTypes } from 'chain-events/src/types';
import { ProposalType } from 'common-common/src/types';
import type { ChainEntity, ChainEvent, ITXModalData, ProposalEndTime, } from 'models';
import { DepositVote, Proposal, ProposalStatus, VotingType, VotingUnit, } from 'models';
import type SubstrateAccounts, { SubstrateAccount } from './account';
import type SubstrateChain from './shared';
import type SubstrateTreasuryTips from './treasury_tips';

const backportEventToAdapter = (
  ChainInfo: SubstrateChain,
  event: SubstrateTypes.INewTip
): ISubstrateTreasuryTip => {
  const { proposalHash, reason, who, finder, deposit, findersFee } = event;
  return {
    identifier: proposalHash,
    hash: proposalHash,
    reason,
    who,
    finder,
    deposit: ChainInfo.createType('u128', deposit),
    findersFee,
  };
};

export class SubstrateTreasuryTip extends Proposal<
  ApiPromise,
  SubstrateCoin,
  ISubstrateTreasuryTip,
  DepositVote<SubstrateCoin>
> {
  public get shortIdentifier() {
    // TODO: better identifier? Maybe based on user?
    return `${this.identifier.toString().slice(0, 5)}…`;
  }

  private _title: string;
  public get title() {
    return (
      this._title ||
      `${this.support.inDollars} ${this.support.denom} to ${this.data.who.slice(
        0,
        8
      )}…`
    );
  }

  private readonly _description: string;
  public get description() {
    return this._description;
  }

  private readonly _author: SubstrateAccount;
  public get author() {
    return this._author;
  }

  private _retracted = false;

  private _slashed = false;

  // TODO: are these voting types correct?
  public readonly votingType = VotingType.SimpleYesApprovalVoting;
  public readonly votingUnit = VotingUnit.CoinVote;

  public canVoteFrom(account: SubstrateAccount) {
    return this._Tips.isMember(account);
  }

  public get support(): SubstrateCoin {
    const deposits = this.getVotes().map((vote) => vote.deposit.inDollars);
    deposits.sort();
    const n = deposits.length;
    let median = 0;
    if (n > 0) {
      median =
        n % 2
          ? deposits[Math.floor(n / 2)]
          : (deposits[Math.floor((n + 1) / 2)] +
              deposits[Math.floor((n - 1) / 2)]) /
            2;
    }
    return this._Chain.coins(median, true);
  }

  public get turnout() {
    return null;
  }

  get isPassing() {
    return ProposalStatus.None;
  }

  get endTime(): ProposalEndTime {
    if (this._data.closing) {
      return { kind: 'fixed_block', blocknum: this._data.closing };
    } else {
      // threshold for moving to "closing" is majority of Tippers elect to tip
      return {
        kind: 'threshold',
        threshold: Math.floor((this._Tips.members.length + 1) / 2),
      };
    }
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Tips: SubstrateTreasuryTips;

  public get blockExplorerLink() {
    const chainInfo = this._Chain.app.chain?.meta;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) {
      const subdomain = blockExplorerIds['subscan'];
      return `https://${subdomain}.subscan.io/treasury_tip/${this.identifier}`;
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
    return `https://polkadot.js.org/apps/?rpc=${rpcUrl}#/treasury/tips`;
  }

  public get votingInterfaceLinkLabel() {
    return 'Vote on polkadot-js';
  }

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Tips: SubstrateTreasuryTips,
    entity: ChainEntity
  ) {
    super(
      ProposalType.SubstrateTreasuryTip,
      backportEventToAdapter(
        ChainInfo,
        entity.chainEvents.find(
          (e) => e.data.kind === SubstrateTypes.EventKind.NewTip
        ).data as SubstrateTypes.INewTip
      )
    );
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Tips = Tips;

    this._author = this._Accounts.fromAddress(this.data.finder);
    this._description = this.data.reason;
    this.createdAt = entity.createdAt;

    entity.chainEvents.forEach((e) => this.update(e));

    this._initialized = true;
    this._Tips.store.add(this);
  }

  protected complete() {
    super.complete(this._Tips.store);
  }

  public update(e: ChainEvent) {
    if (this.completed) {
      return;
    }
    switch (e.data.kind) {
      case SubstrateTypes.EventKind.NewTip: {
        break;
      }
      case SubstrateTypes.EventKind.TipVoted: {
        const acct = this._Accounts.fromAddress(e.data.who);
        const value = new BN(e.data.value);
        const vote = new DepositVote(acct, this._Chain.coins(value));
        this.addOrUpdateVote(vote);
        break;
      }
      case SubstrateTypes.EventKind.TipClosing: {
        this._data.closing = e.data.closing;
        break;
      }
      case SubstrateTypes.EventKind.TipClosed: {
        this._data.payout = this._Chain.createType('u128', e.data.payout);
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.TipRetracted: {
        this._retracted = true;
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.TipSlashed: {
        this._slashed = true;
        this.complete();
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
  }

  // TRANSACTIONS
  public submitVoteTx(vote: DepositVote<SubstrateCoin>): ITXModalData {
    if (!this.canVoteFrom(vote.account as SubstrateAccount)) {
      throw new Error('Voter not in Tippers list.');
    }
    return this._Chain.createTXModalData(
      vote.account as SubstrateAccount,
      (api: ApiPromise) => api.tx.tips.tip(this.data.hash, vote.deposit.asBN),
      'tip',
      this.title
      // (success) => {
      //   if (success) {
      //     this.addOrUpdateVote(vote);
      //   }
      // },
    );
  }
}
