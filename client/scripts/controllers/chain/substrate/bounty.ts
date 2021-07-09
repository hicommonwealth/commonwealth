import { ApiPromise } from '@polkadot/api';

import { formatCoin } from 'adapters/currency';
import { ISubstrateBounty, SubstrateCoin } from 'adapters/chain/substrate/types';
import {
  Proposal, ProposalStatus, ProposalEndTime, ITXModalData, BinaryVote,
  VotingType, VotingUnit, ChainEntity, ChainEvent,
} from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateBountyTreasury from './bountyTreasury';

const backportEventToAdapter = (
  ChainInfo: SubstrateChain,
  event: SubstrateTypes.ITreasuryBountyProposed
): ISubstrateBounty => {
  return {
    identifier: event.bountyIndex.toString(),
    description: 'Unknown bounty', // TODO: add to chain-events
    index: event.bountyIndex,
    value: ChainInfo.createType('u128', event.value),
    fee: ChainInfo.createType('u128', event.fee),
    curator_deposit: ChainInfo.createType('u128', event.curatorDeposit),
    bond: ChainInfo.createType('u128', event.bond),
    proposer: event.proposer,
  };
};

export class SubstrateBounty extends Proposal<ApiPromise, SubstrateCoin, ISubstrateBounty, null> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }

  public setStatus(status) {
    this._title = status.title;
    this._isActive = status.isActive;
    this._isApproved = status.isApproved;
    this._isCuratorProposed = status.isCuratorProposed;
    this._isFunded = status.isFunded;
    this._isPendingPayout = status.isPendingPayout;
    this._isProposed = status.isProposed;
    this._curator = status.curator?.toString();
    this._updateDue = status.updateDue;
    this._unlockAt = status.unlockAt;
    this._beneficiary = status.beneficiary?.toString();

    this._fee = this._Chain.coins(status.fee);
    this._curatorDeposit = this._Chain.coins(status.curatorDeposit);
  }
  public setUpdateDue(updateDue) {
    this._updateDue = updateDue;
  }
  private _title: string;
  private _isActive: boolean;
  private _isApproved: boolean;
  private _isCuratorProposed: boolean;
  private _isFunded: boolean;
  private _isPendingPayout: boolean;
  private _isProposed: boolean;
  private _curator: string;
  private _updateDue;
  private _unlockAt;
  private _beneficiary: string;

  public get title() { return this._title || `Bounty ${this.shortIdentifier}`; }
  public get isActive() { return this._isActive; }
  public get isApproved() { return this._isApproved; }
  public get isCuratorProposed() { return this._isCuratorProposed; }
  public get isFunded() { return this._isFunded; }
  public get isPendingPayout() { return this._isPendingPayout; }
  public get isProposed() { return this._isProposed; }
  public get curator() { return this._curator; }
  public get updateDue() { return this._updateDue; }
  public get unlockAt() { return this._unlockAt; }
  public get beneficiary() { return this._beneficiary; }

  private readonly _description: string;
  public get description() { return this._description; }

  private readonly _author: SubstrateAccount;
  public get author() { return this._author; }

  private _awarded: boolean = false;
  get awarded() { return this._awarded; }

  private _active: boolean = false;
  get active() { return this._active; }

  public readonly _value: SubstrateCoin;
  public get value() { return this._value; }

  public readonly _bond: SubstrateCoin;
  public get bond() { return this._bond; }

  public _fee: SubstrateCoin;
  public get fee() { return this._fee; }

  public _curatorDeposit: SubstrateCoin;
  public get curatorDeposit() { return this._curatorDeposit; }

  public get votingType() {
    return VotingType.None;
  }

  public get votingUnit() {
    return VotingUnit.None;
  }

  public canVoteFrom(account) {
    return false;
  }

  public get support() {
    return null;
  }
  public get turnout() {
    return null;
  }

  get isPassing() {
    if (this.awarded) return ProposalStatus.Passed;
    return ProposalStatus.None;
  }

  get endTime() : ProposalEndTime {
    return { kind: 'unavailable' };
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Treasury: SubstrateBountyTreasury;

  public get blockExplorerLink() {
    const chainInfo = this._Chain.app.chain?.meta?.chain;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) {
      const subdomain = blockExplorerIds['subscan'];
      return `https://${subdomain}.subscan.io/treasury/${this.identifier}`;
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
    return `https://polkadot.js.org/apps/?rpc=${rpcUrl}#/treasury`;
  }

  public get votingInterfaceLinkLabel() {
    return 'Vote on polkadot-js';
  }

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Treasury: SubstrateBountyTreasury,
    entity: ChainEntity,
  ) {
    super('bountyproposal', backportEventToAdapter( // TODO: check if this is the right backport string
      ChainInfo,
      entity.chainEvents
        .find(
          (e) => e.data.kind === SubstrateTypes.EventKind.TreasuryBountyProposed
        ).data as SubstrateTypes.ITreasuryBountyProposed
    ));
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Treasury = Treasury;

    this._value = this._Chain.coins(this.data.value);
    this._bond = this._Chain.coins(this.data.bond);
    this._curatorDeposit = this._Chain.coins(this.data.curator_deposit);
    this._author = this._Accounts.fromAddress(this.data.proposer);
    this._description = this.data.description;
    this.createdAt = entity.createdAt;

    entity.chainEvents.forEach((e) => this.update(e));

    this._initialized = true;
    this._Treasury.store.add(this);
  }

  protected complete() {
    super.complete(this._Treasury.store);
  }

  public update(e: ChainEvent) {
    if (this.completed) {
      return;
    }
    switch (e.data.kind) {
      // proposed by anyone
      case SubstrateTypes.EventKind.TreasuryBountyProposed: {
        this._active = true;
        this._isProposed = true;
        break;
      }
      // proposal rejected by council
      case SubstrateTypes.EventKind.TreasuryBountyRejected: {
        this._awarded = false;
        this._active = false;
        this.complete();
        break;
      }
      // curator accepted
      case SubstrateTypes.EventKind.TreasuryBountyBecameActive: {
        this._isProposed = false;
        this._isActive = true;
        break;
      }
      // extended by curator
      case SubstrateTypes.EventKind.TreasuryBountyExtended: {
        // clear updateDue, it can be re-fetched if needed
        this._updateDue = null;
        break;
      }
      // awarded by curator
      case SubstrateTypes.EventKind.TreasuryBountyAwarded: {
        this._awarded = true;
        this._isActive = false;
        this._isPendingPayout = true;
        break;
      }
      // claimed by recipient
      case SubstrateTypes.EventKind.TreasuryBountyClaimed: {
        this._active = false;
        this.complete();
        break;
      }
      // rejected by council (?)
      case SubstrateTypes.EventKind.TreasuryBountyCanceled: {
        this._active = false;
        this.complete();
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
  }

  // TRANSACTIONS
  public submitVoteTx(vote: BinaryVote<SubstrateCoin>): ITXModalData {
    throw new Error('Cannot vote on a treasury proposal');
  }
}
