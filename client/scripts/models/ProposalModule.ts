import { IApp } from 'state';
import { Coin } from 'adapters/currency';
import { IIdentifiable } from 'adapters/shared';
import { ProposalStore } from '../stores';
import { IVote, ITXModalData, IChainModule, IAccountsModule } from './interfaces';
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

  protected _disabled: boolean = false;
  public get disabled() { return this._disabled; }
  public disable() { this._disabled = true; }

  protected _initializing: boolean = false;
  public get initializing() { return this._initializing; }
  protected _initialized: boolean = false;
  public get initialized() { return this._initialized; }
  public get ready() { return this._initialized || this._disabled; }

  protected _error?: string;
  public get error() { return this._error; }

  private _app: IApp;
  public get app() { return this._app; }

  protected _entityConstructor(entity: ChainEntity): ProposalT {
    // try {
    return this._constructorFunc(entity);
    // } catch (e) {
    //   console.error(`failed to construct proposal from entity: ${e.message}`);
    //   console.error('failed entity: ', entity);
    // }
  }

  public updateProposal(entity: ChainEntity, event: ChainEvent): void {
    const proposal = this.store.getByIdentifier(entity.typeId);
    if (!proposal) {
      this._entityConstructor(entity);
    } else {
      proposal.update(event);
    }
  }

  constructor(app: IApp, protected _constructorFunc?: (e: ChainEntity) => ProposalT) {
    super();
    this._app = app;
  }

  /* `init()` MUST do the following:
    - set `this._initializing` to true while in progress, false before returning
    - set `this._initialized` to true before returning
    - set itself to disabled if the functionality is unavailable on the active chain
    - set an error if functionality throws an error on the active chain
    - guard against multiple calls by returning immediately if initializing/initialized/ready
    - an example:
        (note that it's safe for multiple calls because JS threads will not yield until `return`)
    ```
      public async init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
        this._disabled = !ChainInfo.api.query.democracy;
        if (this._initializing || this._initialized || this.disabled) return;
        this._initializing = true;
        this._Chain = ChainInfo;
        this._Accounts = Accounts;

        .....perform initialization.....

        this._initialized = true;
        this._initializing = false;
      }
    ```
    TODO: create a helper function that encapsulates this boilerplate
  */
  public abstract init(ChainInfo: IChainModule<any, any>, Accounts: IAccountsModule<any, any>): Promise<void>;

  public deinit() {
    this._initialized = false;
    this._error = undefined;
    this.store.getAll().map((p) => p.deinit());
    this.store.clear();
  }

  public abstract createTx(...args): ITXModalData | Promise<ITXModalData>;
}

export default ProposalModule;
