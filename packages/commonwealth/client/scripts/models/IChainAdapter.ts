import type { ChainBase } from '@hicommonwealth/shared';
import type { Coin } from 'adapters/currency';
import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import { clearLocalStorage } from 'stores/PersistentStore';
import { setDarkMode } from '../helpers/darkMode';
import { EXCEPTION_CASE_threadCountersStore } from '../state/ui/thread';
import Account from './Account';
import type ChainInfo from './ChainInfo';
import type { IAccountsModule, IBlockInfo, IChainModule } from './interfaces';

// Extended by a chain's main implementation. Responsible for module
// initialization. Saved as `app.chain` in the global object store.
// TODO: move this from `app.chain` or else rename `chain`?
abstract class IChainAdapter<C extends Coin, A extends Account> {
  protected _apiInitialized = false;
  public get apiInitialized() {
    return this._apiInitialized;
  }

  protected _loaded = false;
  public get loaded() {
    return this._loaded;
  }

  protected _failed = false;
  public get failed() {
    return this._failed;
  }

  public abstract chain: IChainModule<C, A>;
  public abstract accounts: IAccountsModule<A>;

  protected _serverLoaded: boolean;
  public get serverLoaded() {
    return this._serverLoaded;
  }

  public async initServer(): Promise<boolean> {
    clearLocalStorage();
    console.log(`Starting ${this.meta.name}`);

    // only on `1inch`, force enable dark mode
    const darkModePreferenceSet = localStorage.getItem('user-dark-mode-state');
    if (this.meta.id === '1inch') {
      darkModePreferenceSet
        ? setDarkMode(darkModePreferenceSet === 'on')
        : setDarkMode(true);
    }

    // TODO: cleanup EXCEPTION_CASE_threadCountersStore in 8812
    EXCEPTION_CASE_threadCountersStore.setState({
      totalThreadsInCommunity: this.meta.lifetimeThreadCount,
      totalThreadsInCommunityForVoting: this.meta.numVotingThreads,
    });

    this._serverLoaded = true;
    return true;
  }

  public deinitServer() {
    this._serverLoaded = false;
    EXCEPTION_CASE_threadCountersStore.setState({
      totalThreadsInCommunity: 0,
      totalThreadsInCommunityForVoting: 0,
    });
    console.log(`${this.meta.name} stopped`);
  }

  public async initApi(): Promise<void> {
    this._apiInitialized = true;
    console.log(`Started API for ${this.meta.id}.`);
  }

  public async initData(): Promise<void> {
    this._loaded = true;
    this.app.chainModuleReady.emit('ready');
    this.app.isModuleReady = true;
    console.log(`Loaded data for ${this.meta.id}.`);
  }

  public async deinit(): Promise<void> {
    this._apiInitialized = false;
    this.app.isModuleReady = false;
    if (this.app.snapshot) this.app.snapshot.deinit();
    this._loaded = false;
    console.log(`Stopping ${this.meta.id}...`);

    if (
      this.meta.id === '1inch' &&
      !localStorage.getItem('user-dark-mode-state')
    ) {
      setDarkMode(false);
    }
  }

  public abstract base: ChainBase;

  public networkStatus: ApiStatus = ApiStatus.Disconnected;

  public readonly meta: ChainInfo;
  public readonly block: IBlockInfo;

  public app: IApp;

  constructor(meta: ChainInfo, app: IApp) {
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
    return this.meta.id;
  }

  get network() {
    return this.meta.network;
  }

  get currency() {
    return this.meta.default_symbol;
  }
}

export default IChainAdapter;
