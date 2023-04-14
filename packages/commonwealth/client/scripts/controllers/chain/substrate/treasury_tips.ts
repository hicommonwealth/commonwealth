import type { ApiPromise } from '@polkadot/api';
import type { Vec } from '@polkadot/types';
import type { AccountId } from '@polkadot/types/interfaces';
import type { ISubstrateTreasuryTip } from 'adapters/chain/substrate/types';
import { SubstrateTypes } from 'chain-events/src/types';
import type { IApp } from 'state';
import { formatAddressShort } from 'utils';
import ProposalModule from '../../../models/ProposalModule';
import type SubstrateAccounts, { SubstrateAccount } from './account';
import type SubstrateChain from './shared';
import { SubstrateTreasuryTip } from './treasury_tip';

class SubstrateTreasuryTips extends ProposalModule<
  ApiPromise,
  ISubstrateTreasuryTip,
  SubstrateTreasuryTip
> {
  private _members: SubstrateAccount[];
  public get members() {
    return this._members;
  }

  public isMember(account: SubstrateAccount): boolean {
    return (
      account &&
      this._members.find((m) => m.address === account.address) !== undefined
    );
  }

  constructor(app: IApp) {
    super(
      app,
      (e) => new SubstrateTreasuryTip(this._Chain, this._Accounts, this, e)
    );
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public async init(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts
  ): Promise<void> {
    this._disabled = !ChainInfo.api.query.tips;
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // load server proposals
    const entities = this.app.chainEntities.getByType(
      SubstrateTypes.EntityKind.TipProposal
    );
    entities.forEach((e) => this._entityConstructor(e));

    // register new chain-event handlers
    this.app.chainEntities.registerEntityHandler(
      SubstrateTypes.EntityKind.TipProposal,
      (entity, event) => {
        this.updateProposal(entity, event);
      }
    );

    // TODO: ensure council members === tippers for all chains
    const members =
      (await ChainInfo.api.query.council.members()) as Vec<AccountId>;
    this._members = members
      .toArray()
      .map((v) => this._Accounts.fromAddress(v.toString()));

    this._initialized = true;
    this._initializing = false;
  }

  public createTx(
    author: SubstrateAccount,
    reason: string,
    who: SubstrateAccount
  ) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.tips.reportAwesome(reason, who.address),
      'reportAwesome',
      `reportAwesome(${formatAddressShort(who.address)}`
    );
  }
}

export default SubstrateTreasuryTips;
