import { BehaviorSubject } from 'rxjs';
import { ApiRx } from '@polkadot/api';

import { formatCoin } from 'adapters/currency';
import { formatAddressShort } from 'helpers';
import { ISubstrateTreasuryProposal, SubstrateCoin } from 'adapters/chain/substrate/types';
import {
  Proposal, ProposalStatus, ProposalEndTime, ITXModalData, BinaryVote,
  VotingType, VotingUnit, ChainEntity, ChainEvent
} from 'models';
import { ISubstrateTreasuryProposed, SubstrateEventKind } from 'events/edgeware/types';
import { default as SubstrateChain } from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateTreasury from './treasury';

const backportEventToAdapter = (
  ChainInfo: SubstrateChain,
  event: ISubstrateTreasuryProposed
): ISubstrateTreasuryProposal => {
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
  extends Proposal<ApiRx, SubstrateCoin, ISubstrateTreasuryProposal, any, null> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }
  public get title() {
    const account = this._Accounts.fromAddress(this.beneficiaryAddress);
    const displayName = account.profile && account.profile.name
      ? `${account.profile.name} (${formatAddressShort(this.beneficiaryAddress)})`
      : formatAddressShort(this.beneficiaryAddress);
    return `Proposed spend: ${formatCoin(this.value)} to ${displayName}`;
  }
  public get description() { return null; }

  private readonly _author: SubstrateAccount;
  public get author() { return this._author; }

  private _awarded: BehaviorSubject<boolean> = new BehaviorSubject(false);

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

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Treasury: SubstrateTreasury,
    entity: ChainEntity,
  ) {
    super('treasuryproposal', backportEventToAdapter(
      ChainInfo,
      entity.chainEvents
        .find((e) => e.data.kind === SubstrateEventKind.TreasuryProposed).data as ISubstrateTreasuryProposed
    ));
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Treasury = Treasury;

    this.value = this._Chain.coins(this.data.value);
    this.bond = this._Chain.coins(this.data.bond);
    this.beneficiaryAddress = this.data.beneficiary;
    this._author = this._Accounts.fromAddress(this.data.proposer);
    this._Treasury.store.add(this);
  }

  protected complete() {
    super.updateState(this._Treasury.store, { completed: true });
  }

  public update(e: ChainEvent) {
    switch (e.data.kind) {
      case SubstrateEventKind.TreasuryAwarded: {
        this._awarded.next(true);
        this.complete();
        break;
      }
      case SubstrateEventKind.TreasuryRejected: {
        this._awarded.next(false);
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
  get awarded() {
    return this._awarded.getValue();
  }
  protected updateState() {
    throw new Error('not implemented');
  }
}
