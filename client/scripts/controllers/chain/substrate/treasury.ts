import { BehaviorSubject, Unsubscribable } from 'rxjs';
import { first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { BalanceOf, Permill, BlockNumber } from '@polkadot/types/interfaces';

import { formatCoin } from 'adapters/currency';
import { formatAddressShort } from 'helpers';
import {
  ISubstrateTreasuryProposal,
  ISubstrateTreasuryProposalState,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
import { SubstrateTreasuryProposalAdapter } from 'adapters/chain/substrate/subscriptions';
import {
  Proposal, ProposalStatus, ProposalEndTime, ITXModalData, BinaryVote,
  VotingType, VotingUnit, ProposalModule, ChainBase, Account
} from 'models';
import { ProposalStore } from 'stores';
import { default as SubstrateChain } from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';


class SubstrateTreasury extends ProposalModule<
  ApiRx,
  ISubstrateTreasuryProposal,
  ISubstrateTreasuryProposalState,
  SubstrateTreasuryProposal,
  SubstrateTreasuryProposalAdapter
> {
  // TODO: understand Pot behavior
  private _pot = new BehaviorSubject<SubstrateCoin>(null);
  get pot() { return this._pot.value; }

  // The minimum bond for a proposal
  private _bondMinimum: SubstrateCoin = null;
  get bondMinimum() { return this._bondMinimum; }

  // The percentage of a proposal value that will be bonded
  private _bondPct: number = null;
  get bondPct() { return this._bondPct; }

  // The percentage of treasury funds that are burnt every spend period, if left unspent
  private _burnPct: number = null;
  get burnPct() { return this._burnPct; }

  // How often (in blocks) spend periods occur
  private _spendPeriod: number = null;
  get spendPeriod() { return this._spendPeriod; }

  get nextSpendBlock(): number {
    return (Math.floor(this.app.chain.block.height / this.spendPeriod) + 1) * this.spendPeriod;
  }

  public computeBond(amount: SubstrateCoin): SubstrateCoin {
    const computed = amount.muln(this.bondPct);
    return this.bondMinimum.gt(computed) ? this.bondMinimum : this._Chain.coins(computed);
  }

  private _potSubscription: Unsubscribable;
  public deinit() {
    if (this._potSubscription) {
      this._potSubscription.unsubscribe();
    }
    super.deinit();
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    return new Promise((resolve, reject) => {
      this._adapter = new SubstrateTreasuryProposalAdapter();
      this._Chain.api.pipe(first())
      .subscribe((api: ApiRx) => {
        // save parameters
        this._bondPct = +(api.consts.treasury.proposalBond as Permill) / 1_000_000;
        this._bondMinimum = this._Chain.coins(api.consts.treasury.proposalBondMinimum as BalanceOf);
        this._spendPeriod = +(api.consts.treasury.spendPeriod as BlockNumber);
        this._burnPct = +(api.consts.treasury.burn as Permill) / 1_000_000;

        /* TODO: no way to fetch the pot?
        this._potSubscription = this._Chain.api.pipe(
          switchMap((api: ApiRx) => api.query.treasury.pot())
        ).subscribe((pot: BalanceOf) => {
          this._pot.next(this._Chain.coins(pot));
        });
        */

        // Open subscriptions
        this.initSubscription(
          api,
          (ps) => ps.map((p) => new SubstrateTreasuryProposal(ChainInfo, Accounts, this, p))
        ).then(() => {
          this._initialized = true;
          resolve();
        }).catch((err) => {
          reject(err);
        });
      },
      (err) => reject(new Error(err)));
    });
  }

  public createTx(author: SubstrateAccount, value: SubstrateCoin, beneficiary: SubstrateAccount) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.treasury.proposeSpend(value, beneficiary.address),
      'proposeSpend',
      `proposeSpend(${value.format()}, ${formatAddressShort(beneficiary.address)})`
    );
  }
}

export default SubstrateTreasury;

export class SubstrateTreasuryProposal
extends Proposal<ApiRx, SubstrateCoin, ISubstrateTreasuryProposal, ISubstrateTreasuryProposalState, null> {
  public get shortIdentifier() {
    return '#' + this.identifier.toString();
  }
  public get title() {
    const account = this._Accounts.fromAddress(this.beneficiaryAddress);
    const displayName = account.profile && account.profile.name ?
      `${account.profile.name} (${formatAddressShort(this.beneficiaryAddress)})` :
      formatAddressShort(this.beneficiaryAddress);
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
