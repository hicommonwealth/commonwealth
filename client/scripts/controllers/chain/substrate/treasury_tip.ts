import { ApiPromise } from '@polkadot/api';
import BN from 'bn.js';
import { ISubstrateTreasuryTip, SubstrateCoin } from 'adapters/chain/substrate/types';
import {
  Proposal, ProposalStatus, ProposalEndTime, ITXModalData,
  VotingType, VotingUnit, ChainEntity, ChainEvent, DepositVote,
} from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import { chainEntityTypeToProposalSlug } from 'identifiers';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateTreasuryTips from './treasury_tips';

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
  ApiPromise, SubstrateCoin, ISubstrateTreasuryTip, DepositVote<SubstrateCoin>
> {
  public get shortIdentifier() {
    // TODO: better identifier? Maybe based on user?
    return `${this.identifier.toString().slice(0, 5)}…`;
  }

  private _title: string;
  public get title() { return this._title || `Tip ${this.shortIdentifier}`; }

  private readonly _description: string;
  public get description() { return this._description; }

  private readonly _author: SubstrateAccount;
  public get author() { return this._author; }

  private _retracted = false;
  public get retracted() { return this._retracted; }

  private _slashed = false;
  public get slashed() { return this._slashed; }

  public get isClosing() { return !!this.data.closing; }
  public get isClosable() { return this.data.closing &&  this.data.closing <= this._Tips.app.chain.block.height; }

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
      median = (n % 2) ? deposits[Math.floor(n / 2)]
        : (deposits[Math.floor((n + 1) / 2)] + deposits[Math.floor((n - 1) / 2)]) / 2;
    }
    return this._Chain.coins(median, true);
  }
  public get turnout() {
    return null;
  }

  get isPassing() {
    return ProposalStatus.None;
  }

  get endTime() : ProposalEndTime {
    if (this._data.closing) {
      return { kind: 'fixed_block', blocknum: this._data.closing };
    } else {
      // threshold for moving to "closing" is majority of Tippers elect to tip
      return { kind: 'threshold', threshold: Math.floor((this._Tips.members.length + 1) / 2) };
    }
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Tips: SubstrateTreasuryTips;

  public get blockExplorerLink() {
    const chainInfo = this._Chain.app.chain?.meta?.chain;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) {
      const subdomain = blockExplorerIds['subscan'];
      return `https://${subdomain}.subscan.io/treasury_tip/${this.identifier}`;
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
    return `https://polkadot.js.org/apps/?rpc=${rpcUrl}#/treasury/tips`;
  }

  public get votingInterfaceLinkLabel() {
    return 'Vote on polkadot-js';
  }

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Tips: SubstrateTreasuryTips,
    entity: ChainEntity,
  ) {
    super('treasurytip', backportEventToAdapter(
      ChainInfo,
      entity.chainEvents
        .find(
          (e) => e.data.kind === SubstrateTypes.EventKind.NewTip
        ).data as SubstrateTypes.INewTip
    ));
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Tips = Tips;

    this._author = this._Accounts.fromAddress(this.data.finder);
    this._description = this.data.reason;
    this.createdAt = entity.createdAt;

    entity.chainEvents.forEach((e) => this.update(e));

    if (!this.completed) {
      const slug = chainEntityTypeToProposalSlug(entity.type);
      const uniqueId = `${slug}_${entity.typeId}`;
      this._Chain.app.chain.chainEntities._fetchTitle(entity.chain, uniqueId).then((response) => {
        if (response.status === 'Success' && response.result?.length) {
          this._title = response.result;
        }
      });
    }
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
      this.title,
      // (success) => {
      //   if (success) {
      //     this.addOrUpdateVote(vote);
      //   }
      // },
    );
  }

  public closeTx(who: SubstrateAccount): ITXModalData {
    if (!this.data.closing || this.data.closing > this._Tips.app.chain.block.height) {
      throw new Error('Tip not ready for closing.');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiPromise) => api.tx.tips.closeTip(this.data.hash),
      'closeTip',
      this.title,
      // (success) => success && this.complete(),
    );
  }

  public retractTx(who: SubstrateAccount): ITXModalData {
    if (this.data.finder !== who.address) {
      throw new Error('Only finder can retract tip.');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiPromise) => api.tx.tips.retractTip(this.data.hash),
      'retractTip',
      this.title,
      // (success) => {
      //   if (success) {
      //     this._retracted = true;
      //     this.complete();
      //   }
      // }
    );
  }
}
