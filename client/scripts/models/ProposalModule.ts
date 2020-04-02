import { IApp } from 'state';
import { Unsubscribable, of, forkJoin } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { Coin } from 'adapters/currency';
import { IIdentifiable, ICompletable, ProposalAdapter } from 'adapters/shared';
import { ProposalStore } from '../stores';
import { IVote, ITXModalData } from './interfaces';
import Proposal from './Proposal';
import StorageModule from './StorageModule';

// Implemented by a chain's governance module, assuming it uses a proposal-based mechanism.
abstract class ProposalModule<
  ApiT,
  CT extends IIdentifiable,
  ST extends ICompletable,
  ProposalT extends Proposal<ApiT, Coin, CT, ST, IVote<Coin>>,
  AdapterT extends ProposalAdapter<ApiT, CT, ST>
> extends StorageModule {
  public readonly store = new ProposalStore<ProposalT>();

  protected _adapter: AdapterT;
  public get adapter() { return this._adapter; }

  protected _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  protected _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    super();
    this._app = app;
  }

  protected initSubscription(api: ApiT, newPropsFn: (ps: CT[]) => ProposalT[]): Promise<ProposalT[]> {
    return new Promise((resolve, reject) => {
      this._subscription = this.adapter.subscribeNew(api)
        .pipe(
          flatMap((ps: CT[]) => {
            const props = newPropsFn(ps);
            if (props.length === 0) {
              return of(props);
            } else {
              return forkJoin(props.map((p) => p.initialized$)).pipe(map(() => props));
            }
          })
        ).subscribe((props: ProposalT[]) => {
        // console.log('fetched proposals for: ' + this.constructor.name);
          resolve(props);
        }, (err) => {
          console.error(`${this.constructor.name}: proposal error: ${JSON.stringify(err)}`);
          reject(new Error(err));
        });
    });
  }

  protected _subscription: Unsubscribable;

  public deinit() {
    this._initialized = false;
    this._adapter = null;
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
    this.store.getAll().forEach((p) => p.unsubscribe());
    this.store.clear();
  }

  public abstract createTx(...args): ITXModalData;
}

export default ProposalModule;
