import { ApiPromise } from '@polkadot/api';
import { formatCoin } from 'adapters/currency';
import { ISubstrateTreasuryProposal, SubstrateCoin } from 'adapters/chain/substrate/types';
import {
  Proposal, ProposalStatus, ProposalEndTime, ITXModalData, BinaryVote,
  VotingType, VotingUnit, ChainEntity, ChainEvent
} from 'models';
import { ProposalType } from 'common-common/src/types';
import { SubstrateTypes } from 'chain-events/src/types';
import { chainEntityTypeToProposalSlug } from 'identifiers';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateTreasury from './treasury';

const backportEventToAdapter = (
  ChainInfo: SubstrateChain,
  event: SubstrateTypes.ITreasuryProposed | string
): ISubstrateTreasuryProposal => {
  if (typeof event === 'string') return { identifier: event } as ISubstrateTreasuryProposal;
  return {
    identifier: event.proposalIndex.toString(),
    index: event.proposalIndex,
    value: ChainInfo.createType('u128', event.value),
    beneficiary: event.beneficiary,
    bond: ChainInfo.createType('u128', event.bond),
    proposer: event.proposer,
  };
};

export class SubstrateTreasuryProposal
  extends Proposal<ApiPromise, SubstrateCoin, ISubstrateTreasuryProposal, null> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }
  public generateTitle() {
    return `Proposal for ${formatCoin(this.value)}`;
  }
  public get description() { return null; }

  private readonly _author: SubstrateAccount;
  public get author() { return this._author; }

  public title: string;

  private _awarded: boolean = false;
  get awarded() { return this._awarded; }

  public readonly value: SubstrateCoin;
  public readonly bond: SubstrateCoin;
  public readonly beneficiaryAddress: string;

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
  private _Treasury: SubstrateTreasury;

  public get blockExplorerLink() {
    const chainInfo = this._Chain.app.chain?.meta;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) {
      const subdomain = blockExplorerIds['subscan'];
      return `https://${subdomain}.subscan.io/treasury/${this.identifier}`;
    }
    return undefined;
  }

  public get blockExplorerLinkLabel() {
    const chainInfo = this._Chain.app.chain?.meta;
    const blockExplorerIds = chainInfo?.blockExplorerIds;
    if (blockExplorerIds && blockExplorerIds['subscan']) return 'View in Subscan';
    return undefined;
  }

  public get votingInterfaceLink() {
    const rpcUrl = encodeURIComponent(this._Chain.app.chain?.meta?.node.url);
    return `https://polkadot.js.org/apps/?rpc=${rpcUrl}#/treasury`;
  }

  public get votingInterfaceLinkLabel() {
    return 'Vote on polkadot-js';
  }

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Treasury: SubstrateTreasury,
    entity: ChainEntity,
  ) {
    super(ProposalType.SubstrateTreasuryProposal, backportEventToAdapter(
      ChainInfo,
      // sometimes a TreasuryProposed chainEvent isn't available, so we have to fill in stub data
      (entity.chainEvents.find((e) => e.data.kind === SubstrateTypes.EventKind.TreasuryProposed)?.data as SubstrateTypes.ITreasuryProposed) || entity.typeId
    ));
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Treasury = Treasury;

    this.value = this._Chain.coins(this.data.value);
    this.bond = this._Chain.coins(this.data.bond);
    this.beneficiaryAddress = this.data.beneficiary;
    this._author = this.data.proposer ? this._Accounts.fromAddress(this.data.proposer)
      : entity.author ? this._Accounts.fromAddress(this.data.proposer) : null;

    this.title = entity.title || this.generateTitle();
    this.createdAt = entity.createdAt;
    this.threadId = entity.threadId;
    this.threadTitle = entity.threadTitle;

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
    switch (e.data?.kind) {
      case SubstrateTypes.EventKind.TreasuryProposed: {
        break;
      }
      case SubstrateTypes.EventKind.TreasuryAwarded: {
        this._awarded = true;
        this.complete();
        break;
      }
      case SubstrateTypes.EventKind.TreasuryRejected: {
        this._awarded = false;
        this.complete();
        break;
      }
      default: {
        throw new Error('invalid event update');
      }
    }
  }

  // GETTERS AND SETTERS
  // none

  // TRANSACTIONS
  public submitVoteTx(vote: BinaryVote<SubstrateCoin>): ITXModalData {
    throw new Error('Cannot vote on a treasury proposal');
  }
}
