import { ApiPromise } from '@polkadot/api';
import { AccountId } from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types';
import { ISubstrateTreasuryTip, SubstrateCoin } from 'adapters/chain/substrate/types';
import { SubstrateTypes } from '@commonwealth/chain-events';
import { ProposalModule } from 'models';
import { IApp } from 'state';
import { formatAddressShort } from 'utils';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { SubstrateTreasuryTip } from './treasury_tip';

class SubstrateTreasuryTips extends ProposalModule<
  ApiPromise,
  ISubstrateTreasuryTip,
  SubstrateTreasuryTip
> {
  private _members: SubstrateAccount[];
  public get members() { return this._members; }
  public isMember(account: SubstrateAccount): boolean {
    return account && this._members.find((m) => m.address === account.address) !== undefined;
  }

  constructor(app: IApp) {
    super(app, (e) => new SubstrateTreasuryTip(this._Chain, this._Accounts, this, e));
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public async init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._disabled = !ChainInfo.api.query.tips;
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // load server proposals
    const entities = this.app.chain.chainEntities.store.getByType(SubstrateTypes.EntityKind.TipProposal);
    entities.forEach((e) => this._entityConstructor(e));

    // register new chain-event handlers
    this.app.chain.chainEntities.registerEntityHandler(
      SubstrateTypes.EntityKind.TipProposal, (entity, event) => {
        this.updateProposal(entity, event);
      }
    );

    // fetch proposals from chain
    await this.app.chain.chainEntities.fetchEntities(
      this.app.chain.id,
      () => this._Chain.fetcher.fetchTips(this.app.chain.block.height)
    );

    // TODO: ensure council members === tippers for all chains
    const members = await ChainInfo.api.query.council.members() as Vec<AccountId>;
    this._members = members.toArray().map((v) => this._Accounts.fromAddress(v.toString()));

    this._initialized = true;
    this._initializing = false;
  }

  public createTx(
    author: SubstrateAccount,
    reason: string,
    who: SubstrateAccount,
  ) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.tips.reportAwesome(reason, who.address),
      'reportAwesome',
      `reportAwesome(${formatAddressShort(who.address)}`,
    );
  }

  public createTxAsTipper(
    author: SubstrateAccount,
    reason: string,
    who: SubstrateAccount,
    value: SubstrateCoin,
  ) {
    if (!this.isMember(author)) {
      throw new Error('Must be tipper to call tipNew.');
    }
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.tips.tipNew(reason, who.address, value.asBN),
      'tipNew',
      `tipNew(${formatAddressShort(who.address)}`,
    );
  }
}

export default SubstrateTreasuryTips;
