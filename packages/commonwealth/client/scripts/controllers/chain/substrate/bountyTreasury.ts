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
import { chainToEventNetwork } from '../../server/chain_entities';

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
    this._disabled = !ChainInfo.api.consts.bounties && !ChainInfo.api.consts.treasury;
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
      chainToEventNetwork(this.app.chain.meta),
      () => this._Chain.fetcher.fetchBounties(this.app.chain.block.height),
    );

    // fetch extra metadata
    // TODO: this should be picked up by the chain-events system
    const extra = await ChainInfo.api.derive.bounties.bounties();
    extra.forEach((b) => {
      const index = b.index.toNumber();
      const bounty = this.store.getByIdentifier(index);
      if (!bounty) {
        console.log('Unexpected missing bounty, on chain but not returned by chain-events');
        return;
      }
      const data = {
        title: b.description,
        // state
        isActive: b.bounty.status.isActive,
        isApproved: b.bounty.status.isApproved,
        isCuratorProposed: b.bounty.status.isCuratorProposed,
        isFunded: b.bounty.status.isFunded,
        isPendingPayout: b.bounty.status.isPendingPayout,
        isProposed: b.bounty.status.isProposed,
        // metadata
        fee: b.bounty.fee,
        curatorDeposit: b.bounty.curatorDeposit,
        bond: b.bounty.bond,
        curator: b.bounty.status.isCuratorProposed ? b.bounty.status.asCuratorProposed?.curator
          : b.bounty.status.isActive ? b.bounty.status.asActive.curator
            : b.bounty.status.isPendingPayout ? b.bounty.status.asPendingPayout.curator : null,
        updateDue: b.bounty.status.isActive ? b.bounty.status.asActive.updateDue : null,
        beneficiary: b.bounty.status.isPendingPayout ? b.bounty.status.asPendingPayout.beneficiary : null,
        unlockAt: b.bounty.status.isPendingPayout ? b.bounty.status.asPendingPayout.unlockAt : null,
      };
      bounty.setStatus(data);
    });

    this._initialized = true;
    this._initializing = false;
  }

  // anyone proposes a bounty
  public createTx(author: SubstrateAccount, value: SubstrateCoin, description: string) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.bounties.proposeBounty(value, description),
      'proposeBounty',
      `proposeBounty(${description}, ${value})`
    );
  }

  // council approves a bounty
  public createBountyApprovalMotionTx(author: SubstrateAccount, bountyId: number, threshold: number) {
    const action = this._Chain.getTxMethod('bounties', 'approveBounty', [ bountyId ]);
    const length = 1000;
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.council.propose(threshold, action, length),
      'approveBounty',
      `approveBounty(${bountyId})`
    );
  }

  // council approves a curator
  public proposeCuratorTx(author: SubstrateAccount, bountyId: number, curator: string, fee: SubstrateCoin, threshold: number) {
    const action = this._Chain.getTxMethod('bounties', 'proposeCurator', [ bountyId, curator, fee ]);
    const length = 1000;
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.council.propose(threshold, action, length),
      'proposeCurator',
      `proposeCurator(${bountyId}, ${curator}, ${fee})`
    );
  }

  // curator accepts the bounty
  public acceptCuratorTx(author: SubstrateAccount, bountyId: number) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.bounties.acceptCurator(bountyId),
      'acceptCurator',
      `acceptCurator(${bountyId})`
    );
  }

  // curator awards the bounty
  public awardBountyTx(author: SubstrateAccount, bountyId: number, recipient: string) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.bounties.awardBounty(bountyId, recipient),
      'awardBounty',
      `awardBounty(${bountyId}, ${recipient})`
    );
  }

  // curator extends the bounty
  public extendBountyExpiryTx(author: SubstrateAccount, bountyId: number, remark: string) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.bounties.extendBountyExpiry(bountyId, remark),
      'extendBountyExpiry',
      `extendBountyExpiry(${bountyId}, ${remark})`
    );
  }

  // recipient claims the bounty
  public claimBountyTx(author: SubstrateAccount, bountyId: number) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.bounties.claimBounty(bountyId),
      'claimBounty',
      `claimBounty(${bountyId})`
    );
  }
}

export default SubstrateBountyTreasury;
