import { BehaviorSubject, Unsubscribable } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { BalanceOf, Permill, BlockNumber } from '@polkadot/types/interfaces';
import { DeriveBalancesAccount } from '@polkadot/api-derive/types';
import { stringToU8a, u8aToHex } from '@polkadot/util';
import { IApp } from 'state';
import {
  ISubstrateBounty,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
import { ProposalModule } from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { formatAddressShort } from '../../../../../shared/utils';
import { SubstrateBounty } from './bounty_proposal';

class SubstrateBountyTreasury extends ProposalModule<
  ApiRx,
  ISubstrateBounty,
  SubstrateBounty
> {
  // TODO: understand Pot behavior
  private _pot = new BehaviorSubject<SubstrateCoin>(null);
  get pot() { return this._pot.value; }

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


  // public computeBond(amount: SubstrateCoin): SubstrateCoin {
  //   const computed = amount.muln(this.bondPct);
  //   return this.bondMinimum.gt(computed) ? this.bondMinimum : this._Chain.coins(computed);
  // }

  private _potSubscription: Unsubscribable;
  public deinit() {
    if (this._potSubscription) {
      this._potSubscription.unsubscribe();
    }
    super.deinit();
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  constructor(app: IApp) {
    super(app, (e) => new SubstrateBounty(this._Chain, this._Accounts, this, e));
  }

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // load server proposals
    const entities = this.app.chain.chainEntities.store.getByType(SubstrateTypes.EntityKind.TreasuryProposal);
    const proposals = entities.map((e) => this._entityConstructor(e));

    return new Promise((resolve, reject) => {
      this._Chain.api.pipe(first()).subscribe(async (api: ApiRx) => {
        // save parameters
        // this._bondPct = +(api.query.treasury.bounties as Permill) / 1_000_000;
        this._bountyCuratorDeposit = this._Chain.coins(api.consts.treasury.bountyCuratorDeposit);
        this._bountyDepositBase = this._Chain.coins(api.consts.treasury.bountyDepositBase);
        this._bountyDepositPayoutDelay = this._Chain.coins(api.consts.treasury.bountyDepositPayoutDelay);
        this._bountyValueMinimum = this._Chain.coins(api.consts.treasury.bountyValueMinimum);

        // kick off subscriptions
        const TREASURY_ACCOUNT = u8aToHex(stringToU8a('modlpy/trsry'.padEnd(32, '\0')));
        await new Promise((innerResolve) => {
          this._potSubscription = api.derive.balances.account(TREASURY_ACCOUNT)
            .subscribe((pot: DeriveBalancesAccount) => {
              this._pot.next(this._Chain.coins(pot.freeBalance));
              innerResolve();
            });
        });

        // register new chain-event handlers
        this.app.chain.chainEntities.registerEntityHandler(
          SubstrateTypes.EntityKind.TreasuryBounty, (entity, event) => {
            this.updateProposal(entity, event);
          }
        );

        // fetch proposals from chain
        await this.app.chain.chainEntities.fetchEntities(
          this.app.chain.id,
          () => this._Chain.fetcher.fetchTreasuryBounties(this.app.chain.block.height),
        );

        this._initialized = true;
        this._initializing = false;
        resolve();
      });
    });
  }

  public createTx(author: SubstrateAccount, value: SubstrateCoin, beneficiary: SubstrateAccount) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.treasury.proposeSpend(value, beneficiary.address),
      'proposeSpend',
      `proposeSpend(${value.format()}, ${formatAddressShort(beneficiary.address, beneficiary.chain.id)})`
    );
  }
}

export default SubstrateBountyTreasury;
