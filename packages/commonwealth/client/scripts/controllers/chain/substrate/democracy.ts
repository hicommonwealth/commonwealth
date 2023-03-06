import type { ApiPromise } from '@polkadot/api';
import type { BlockNumber } from '@polkadot/types/interfaces';
import type {
  ISubstrateDemocracyReferendum,
  SubstrateCoin,
} from 'adapters/chain/substrate/types';
import { SubstrateTypes } from 'chain-events/src/types';
import type { ITXModalData } from 'models';
import { ProposalModule } from 'models';
import type { IApp } from 'state';
import type SubstrateAccounts from './account';
import { SubstrateDemocracyReferendum } from './democracy_referendum';
import type SubstrateChain from './shared';

class SubstrateDemocracy extends ProposalModule<
  ApiPromise,
  ISubstrateDemocracyReferendum,
  SubstrateDemocracyReferendum
> {
  private _enactmentPeriod: number = null;
  private _cooloffPeriod: number = null;
  private _votingPeriod: number = null;
  private _emergencyVotingPeriod: number = null;
  private _preimageByteDeposit: SubstrateCoin = null;

  get enactmentPeriod() {
    return this._enactmentPeriod;
  }

  get votingPeriod() {
    return this._votingPeriod;
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public getByHash(hash: string) {
    return this.store.getAll().find((referendum) => referendum.hash === hash);
  }

  constructor(app: IApp) {
    super(
      app,
      (e) =>
        new SubstrateDemocracyReferendum(this._Chain, this._Accounts, this, e)
    );
  }

  // Loads all proposals and referendums currently present in the democracy module
  public async init(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts
  ): Promise<void> {
    this._disabled = !ChainInfo.api.query.democracy;
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // load server referenda
    const entities = this.app.chainEntities.getByType(
      SubstrateTypes.EntityKind.DemocracyReferendum
    );
    entities.forEach((e) => this._entityConstructor(e));

    // save parameters
    this._enactmentPeriod = +(ChainInfo.api.consts.democracy
      .enactmentPeriod as BlockNumber);
    this._cooloffPeriod = +(ChainInfo.api.consts.democracy
      .cooloffPeriod as BlockNumber);
    this._votingPeriod = +(ChainInfo.api.consts.democracy
      .votingPeriod as BlockNumber);
    this._emergencyVotingPeriod = +(ChainInfo.api.consts.democracy
      .emergencyVotingPeriod as BlockNumber);
    this._preimageByteDeposit = this._Chain.coins(
      ChainInfo.api.consts.democracy.preimageByteDeposit
    );

    // register chain-event handlers
    this.app.chainEntities.registerEntityHandler(
      SubstrateTypes.EntityKind.DemocracyReferendum,
      (entity, event) => {
        this.updateProposal(entity, event);
      }
    );
    this.app.chainEntities.registerEntityHandler(
      SubstrateTypes.EntityKind.DemocracyPreimage,
      (entity, event) => {
        if (event.data.kind === SubstrateTypes.EventKind.PreimageNoted) {
          const referendum = this.getByHash(entity.typeId);
          if (referendum) referendum.update(event);
        }
      }
    );

    this._initialized = true;
    this._initializing = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createTx(...args): ITXModalData {
    throw new Error('cannot directly create democracy referendum');
  }
}

export default SubstrateDemocracy;
