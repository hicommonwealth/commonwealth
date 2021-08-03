import { ApiPromise } from '@polkadot/api';
import { BalanceOf, Permill, BlockNumber } from '@polkadot/types/interfaces';
import { stringToU8a, u8aToHex } from '@polkadot/util';
import { IApp } from 'state';
import {
  ISubstrateTreasuryProposal,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
import { ProposalModule } from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { formatAddressShort } from '../../../../../shared/utils';
import { SubstrateTreasuryProposal } from './treasury_proposal';

class SubstrateTreasury extends ProposalModule<
  ApiPromise,
  ISubstrateTreasuryProposal,
  SubstrateTreasuryProposal
> {
  // TODO: understand Pot behavior
  private _pot: SubstrateCoin = null;
  get pot() { return this._pot; }

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

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  constructor(app: IApp) {
    super(app, (e) => new SubstrateTreasuryProposal(this._Chain, this._Accounts, this, e));
  }

  public async init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._disabled = !ChainInfo.api.query.treasury;
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // load server proposals
    const entities = this.app.chain.chainEntities.store.getByType(SubstrateTypes.EntityKind.TreasuryProposal);
    entities.forEach((e) => this._entityConstructor(e));

    // save parameters
    this._bondPct = +(ChainInfo.api.consts.treasury.proposalBond as Permill) / 1_000_000;
    this._bondMinimum = this._Chain.coins(ChainInfo.api.consts.treasury.proposalBondMinimum as BalanceOf);
    this._spendPeriod = +(ChainInfo.api.consts.treasury.spendPeriod as BlockNumber);
    this._burnPct = +(ChainInfo.api.consts.treasury.burn as Permill) / 1_000_000;

    const TREASURY_ACCOUNT = u8aToHex(stringToU8a('modlpy/trsry'.padEnd(32, '\0')));
    const pot = await ChainInfo.api.derive.balances.account(TREASURY_ACCOUNT);
    this._pot = this._Chain.coins(pot.freeBalance);

    // register new chain-event handlers
    this.app.chain.chainEntities.registerEntityHandler(
      SubstrateTypes.EntityKind.TreasuryProposal, (entity, event) => {
        this.updateProposal(entity, event);
      }
    );

    // fetch proposals from chain
    await this.app.chain.chainEntities.fetchEntities(
      this.app.chain.id,
      () => this._Chain.fetcher.fetchTreasuryProposals(this.app.chain.block.height),
    );

    this._initialized = true;
    this._initializing = false;
  }

  public createTx(author: SubstrateAccount, value: SubstrateCoin, beneficiary: SubstrateAccount) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.treasury.proposeSpend(value, beneficiary.address),
      'proposeSpend',
      `proposeSpend(${value.format()}, ${formatAddressShort(beneficiary.address, beneficiary.chain.id)})`
    );
  }
}

export default SubstrateTreasury;
