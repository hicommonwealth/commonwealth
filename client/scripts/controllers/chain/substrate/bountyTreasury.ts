import { ApiPromise } from '@polkadot/api';
import { BalanceOf, Permill } from '@polkadot/types/interfaces';
import { IApp } from 'state';
import {
  ISubstrateBounty,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
import { ProposalModule } from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { SubstrateBounty } from './bounty';

class SubstrateBountyTreasury extends ProposalModule<
  ApiPromise,
  ISubstrateBounty,
  SubstrateBounty
> {
  // The minimum curator deposit for a bounty
  private _bountyCuratorDeposit: SubstrateCoin = null;
  get bountyCuratorDeposit() { return this._bountyCuratorDeposit; }

  // The minimum deposit base for a bounty
  private _bountyDepositBase: SubstrateCoin = null;
  get bountyDepositBase() { return this._bountyDepositBase; }

  // The payout delay for a bounty
  private _bountyDepositPayoutDelay: SubstrateCoin = null;
  get bountyDepositPayoutDelay() { return this._bountyDepositPayoutDelay; }

  // The minimum value for a bounty
  private _bountyValueMinimum: SubstrateCoin = null;
  get bountyValueMinimum() { return this._bountyValueMinimum; }


  // The percentage of a proposal value that will be bonded
  private _bondPct: number = null;
  get bondPct() { return this._bondPct; }

  // The minimum bond for a proposal
  private _bondMinimum: SubstrateCoin = null;
  get bondMinimum() { return this._bondMinimum; }

  public computeBond(amount: SubstrateCoin): SubstrateCoin {
    const computed = amount.muln(this.bondPct);
    return this.bondMinimum.gt(computed) ? this.bondMinimum : this._Chain.coins(computed);
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  constructor(app: IApp) {
    super(app, (e) => new SubstrateBounty(this._Chain, this._Accounts, this, e));
  }

  public async init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // load server proposals
    const entities = this.app.chain.chainEntities.store.getByType(SubstrateTypes.EntityKind.TreasuryBounty);
    entities.forEach((e) => this._entityConstructor(e));

    // save parameters
    this._bondPct = +(ChainInfo.api.consts.treasury.proposalBond as Permill) / 1_000_000;
    this._bondMinimum = this._Chain.coins(ChainInfo.api.consts.treasury.proposalBondMinimum as BalanceOf);
    this._bountyCuratorDeposit = this._Chain.coins(ChainInfo.api.consts.treasury.bountyCuratorDeposit);
    this._bountyDepositBase = this._Chain.coins(ChainInfo.api.consts.treasury.bountyDepositBase);
    this._bountyDepositPayoutDelay = this._Chain.coins(ChainInfo.api.consts.treasury.bountyDepositPayoutDelay);
    this._bountyValueMinimum = this._Chain.coins(ChainInfo.api.consts.treasury.bountyValueMinimum);

    // kick off subscriptions
    // const TREASURY_ACCOUNT = u8aToHex(stringToU8a('modlpy/trsry'.padEnd(32, '\0')));

    // register new chain-event handlers
    this.app.chain.chainEntities.registerEntityHandler(
      SubstrateTypes.EntityKind.TreasuryBounty, (entity, event) => {
        this.updateProposal(entity, event);
      }
    );

    // fetch proposals from chain
    await this.app.chain.chainEntities.fetchEntities(
      this.app.chain.id,
      () => this._Chain.fetcher.fetchBounties(this.app.chain.block.height),
    );

    this._initialized = true;
    this._initializing = false;
  }

  public createTx(author: SubstrateAccount, description: string, value: string) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.bounties.createBounty(author.address, description, value),
      'createBounty',
      `createBounty(${author.address}, ${description}, ${value})`
    );
  }
}

export default SubstrateBountyTreasury;
