import moment from 'moment-twitter';
import { ApiStatus, IApp } from 'state';
import { Coin } from 'shared/adapters/currency';

import { IChainModule, IAccountsModule, IServerControllers, IBlockInfo } from './interfaces';
import { ChainBase, ChainClass } from './types';
import Account from './Account';
import NodeInfo from './NodeInfo';

// Extended by a chain's main implementation. Responsible for module
// initialization. Saved as `app.chain` in the global object store.
// TODO: move this from `app.chain` or else rename `chain`?
abstract class IChainAdapter<C extends Coin, A extends Account<C>> {
  public abstract loaded: boolean;
  public abstract chain: IChainModule<C, A>;
  public abstract accounts: IAccountsModule<C, A>;
  public abstract server: IServerControllers;

  protected _serverLoaded: boolean;
  get serverLoaded() { return this._serverLoaded; }

  public async init(onServerLoaded? : () => void, initChainModuleFn?: () => Promise<void>): Promise<void> {
    await this.app.threads.refreshAll(this.id, null, true);
    await this.app.comments.refreshAll(this.id, null, true);
    await this.app.reactions.refreshAll(this.id, null, true);
    await this.app.tags.refreshAll(this.id, null, true);
    this._serverLoaded = true;
    if (onServerLoaded) await onServerLoaded();
    await initChainModuleFn();
    this.app.chainModuleReady.next(true);
  }

  public abstract deinit: () => Promise<void>;

  public abstract base: ChainBase;
  public abstract class: ChainClass;

  public networkStatus: ApiStatus = ApiStatus.Disconnected;
  public networkError: string;

  public readonly meta: NodeInfo;
  public readonly block: IBlockInfo;

  public app: IApp;
  public version: string;
  public name: string;
  public runtimeName: string;

  constructor(meta: NodeInfo, app: IApp) {
    this.meta = meta;
    this.app = app;
    this.block = {
      height: 0,
      duration: 0,
      lastTime: moment(),
      isIrregular: false,
    };
  }

  get id() {
    return this.meta.chain.id;
  }
  get network() {
    return this.meta.chain.network;
  }
  get currency() {
    return this.meta.chain.symbol;
  }
}

export default IChainAdapter;
