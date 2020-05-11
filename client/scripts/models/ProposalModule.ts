import { IApp } from 'state';
import { Coin } from 'adapters/currency';
import { IIdentifiable } from 'adapters/shared';
import { ProposalStore } from '../stores';
import { IVote, ITXModalData } from './interfaces';
import Proposal from './Proposal';
import StorageModule from './StorageModule';

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
