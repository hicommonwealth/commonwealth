import { ApiPromise } from '@polkadot/api';

import { formatCoin } from 'adapters/currency';
import {
  ISubstrateBounty,
  SubstrateCoin,
} from 'adapters/chain/substrate/types';
import {
  Proposal,
  ProposalStatus,
  ProposalEndTime,
  ITXModalData,
  BinaryVote,
  VotingType,
  VotingUnit,
  ChainEntity,
  ChainEvent,
} from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import { formatAddressShort } from '../../../../../shared/utils';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateBountyTreasury from './bountyTreasury';

const backportEventToAdapter = (
  ChainInfo: SubstrateChain,
  event: SubstrateTypes.ITreasuryBountyProposed
): ISubstrateBounty => {
  return {
    identifier: event.bountyIndex.toString(),
    index: event.bountyIndex,
    value: ChainInfo.createType('u128', event.value),
    fee: ChainInfo.createType('u128', event.fee),
    curator_deposit: ChainInfo.createType('u128', event.curatorDeposit),
    bond: ChainInfo.createType('u128', event.bond),
    proposer: event.proposer,
  };
};

export class SubstrateBounty extends Proposal<
  ApiPromise,
  SubstrateCoin,
  ISubstrateBounty,
  null
> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }
  public get title() {
    const account = this._Accounts.fromAddress(this.author.address);
    const displayName =
      account.profile && account.profile.name
        ? `${account.profile.name} (${formatAddressShort(
            this.author.address,
            account.chain.id
          )})`
        : formatAddressShort(this.author.address, account.chain.id);
    return `${
      this.completed || this.active ? '' : 'Proposed '
    } Bounty: ${formatCoin(this._value)} to ${displayName}`;
  }
  public get description() {
    return null;
  }

  private readonly _author: SubstrateAccount;
  public get author() {
    return this._author;
  }

  private _awarded = false;
  get awarded() {
    return this._awarded;
  }

  private _active = false;
  get active() {
    return this._active;
  }

  public readonly _value: SubstrateCoin;
  public get value() {
    return this._value;
  }

  public readonly _bond: SubstrateCoin;
  public get bond() {
    return this._bond;
  }

  public readonly _fee: SubstrateCoin;
  public get fee() {
    return this._fee;
  }

  public readonly _curatorDeposit: SubstrateCoin;
  public get curatorDeposit() {
    return this._curatorDeposit;
  }

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

  get endTime(): ProposalEndTime {
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
    if (blockExplorerIds && blockExplorerIds['subscan'])
      return 'View in Subscan';
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
    entity: ChainEntity
  ) {
    super(
      'bountyproposal',
      backportEventToAdapter(
        // TODO: check if this is the right backport string
        ChainInfo,
        entity.chainEvents.find(
          (e) => e.data.kind === SubstrateTypes.EventKind.TreasuryBountyProposed
        ).data as SubstrateTypes.ITreasuryBountyProposed
      )
    );
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Treasury = Treasury;

    this._value = this._Chain.coins(this.data.value);
    this._bond = this._Chain.coins(this.data.bond);
    this._curatorDeposit = this._Chain.coins(this.data.curator_deposit);
    this._author = this._Accounts.fromAddress(this.data.proposer);
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
      case SubstrateTypes.EventKind.TreasuryBountyProposed: {
        break;
      }
      case SubstrateTypes.EventKind.TreasuryBountyBecameActive: {
        this._active = true;
        break;
      }
      case SubstrateTypes.EventKind.TreasuryBountyCanceled: {
        this._active = false;
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.TreasuryBountyExtended: {
        break;
      }
      case SubstrateTypes.EventKind.TreasuryBountyAwarded: {
        this._awarded = true;
        this._active = false;
        break;
      }
      case SubstrateTypes.EventKind.TreasuryBountyRejected: {
        this.complete();
        this._active = false;
        break;
      }
      case SubstrateTypes.EventKind.TreasuryBountyClaimed: {
        this._awarded = true;
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
