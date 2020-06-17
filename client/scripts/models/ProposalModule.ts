import { IApp } from 'state';
import { Coin } from 'adapters/currency';
import { IIdentifiable } from 'adapters/shared';
import { ProposalStore } from '../stores';
import { IVote, ITXModalData } from './interfaces';
import Proposal from './Proposal';
import StorageModule from './StorageModule';
import ChainEntity from './ChainEntity';
import ChainEvent from './ChainEvent';

// Implemented by a chain's governance module, assuming it uses a proposal-based mechanism.
export abstract class ProposalModule<
  ApiT,
  CT extends IIdentifiable,
  ProposalT extends Proposal<ApiT, Coin, CT, IVote<Coin>>,
> extends StorageModule {
  public readonly store = new ProposalStore<ProposalT>();

  protected _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  private _app: IApp;
  public get app() { return this._app; }

  protected _entityConstructor(constructorFunc: (e: ChainEntity) => ProposalT, entity: ChainEntity): ProposalT {
    try {
      return constructorFunc(entity);
    } catch (e) {
      console.error('failed to construct proposal from entity: ', entity);
    }
  }

  public updateProposal(constructorFunc: (e: ChainEntity) => ProposalT, entity: ChainEntity, event: ChainEvent): void {
    const proposal = this.store.getByIdentifier(entity.typeId);
    if (!proposal) {
      this._entityConstructor(constructorFunc, entity);
    } else {
      proposal.update(event);
    }
  }

  constructor(app: IApp) {
    super();
    this._app = app;
  }

  public deinit() {
    this._initialized = false;
    this.store.getAll().map((p) => p.deinit());
    this.store.clear();
  }

  public abstract createTx(...args): ITXModalData | Promise<ITXModalData>;
}

export default ProposalModule;
