import { ApiPromise } from '@polkadot/api';
import { BalanceOf, Permill, BlockNumber } from '@polkadot/types/interfaces';
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
  private _bountyDepositPayoutDelay: BlockNumber = null;
  get bountyDepositPayoutDelay() { return this._bountyDepositPayoutDelay; }

  // The minimum value for a bounty
  private _bountyValueMinimum: SubstrateCoin = null;
  get bountyValueMinimum() { return this._bountyValueMinimum; }

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
    const bountyModule = ChainInfo.api.consts.bounties || ChainInfo.api.consts.treasury;
    this._bountyCuratorDeposit = this._Chain.coins(bountyModule.bountyCuratorDeposit as Permill);
    this._bountyDepositBase = this._Chain.coins(bountyModule.bountyDepositBase as BalanceOf);
    this._bountyDepositPayoutDelay = bountyModule.bountyDepositPayoutDelay as BlockNumber;
    this._bountyValueMinimum = this._Chain.coins(bountyModule.bountyValueMinimum as BalanceOf);

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
      (api: ApiPromise) => api.tx.bounties
        ? api.tx.bounties.createBounty(author.address, description, value)
        : api.tx.treasury.proposeBounty(value, description),
      'createBounty',
      `createBounty(${author.address}, ${description}, ${value})`
    );
  }
}

export default SubstrateBountyTreasury;
