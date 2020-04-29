import { BehaviorSubject } from 'rxjs';
import { ApiRx } from '@polkadot/api';

import { formatCoin } from 'adapters/currency';
import { formatAddressShort } from 'helpers';
import {
  ISubstrateTreasuryProposal,
  ISubstrateTreasuryProposalState,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
import {
  Proposal, ProposalStatus, ProposalEndTime, ITXModalData, BinaryVote,
  VotingType, VotingUnit
} from 'models';
import { ProposalStore } from 'stores';
import { default as SubstrateChain } from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateTreasury from './treasury';

export class SubstrateTreasuryProposal
  extends Proposal<ApiRx, SubstrateCoin, ISubstrateTreasuryProposal, ISubstrateTreasuryProposalState, null> {
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
  public get author() { return this._author; }

  private _approved: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _awarded: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public readonly value: SubstrateCoin;
  public readonly bond: SubstrateCoin;
  public readonly beneficiaryAddress: string;
  private readonly _author: SubstrateAccount;

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
    if (this.approved) return ProposalStatus.Passed;
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
    data: ISubstrateTreasuryProposal
  ) {
    super('treasuryproposal', data);
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Treasury = Treasury;

    this.value = this._Chain.coins(data.value);
    this.bond = this._Chain.coins(data.bond);
    this.beneficiaryAddress = data.beneficiary;
    this._author = this._Accounts.fromAddress(data.proposer);

    this.subscribe(
      this._Chain.api,
      this._Treasury.store,
      this._Treasury.adapter
    );
    this._Treasury.store.add(this);
  }

  // GETTERS AND SETTERS
  // none

  // TRANSACTIONS
  public submitVoteTx(vote: BinaryVote<SubstrateCoin>): ITXModalData {
    return {
      author: this._Accounts.fromAddress(vote.account.address),
      txType: 'INVALID',
      txData: {
        transact: () => {
          throw new Error('Cannot vote on a treasury proposal');
        },
        unsignedData: () => {
          throw new Error('Cannot vote on a treasury proposal');
        }
      }
    };
  }
  get awarded() {
    return this._awarded.getValue();
  }
  get approved() {
    return this._approved.getValue();
  }
  protected updateState(store: ProposalStore<SubstrateTreasuryProposal>, state: ISubstrateTreasuryProposalState) {
    this._approved.next(state.approved);
    this._awarded.next(state.awarded);
    super.updateState(store, state);
  }
}
