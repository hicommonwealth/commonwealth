import { ExtendedCommunity } from '@hicommonwealth/schemas';
import type { ChainBase } from '@hicommonwealth/shared';
import type { Coin } from 'adapters/currency';
import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import { clearLocalStorage } from 'stores/PersistentStore';
import { z } from 'zod';
import { darkModeStore } from '../state/ui/darkMode/darkMode';
import Account from './Account';
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
    if (this.meta.id === '1inch') {
      darkModeStore.getState().setDarkMode(true);
    }

    this._serverLoaded = true;
    return true;
  }

  public deinitServer() {
    this._serverLoaded = false;
    console.log(`${this.meta.name} stopped`);

    if (this.meta.id === '1inch') {
      darkModeStore.getState().setDarkMode(false);
    }
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
    this._loaded = false;
    console.log(`Stopping ${this.meta.id}...`);

    if (this.meta.id === '1inch' && darkModeStore.getState().isDarkMode) {
      darkModeStore.getState().setDarkMode(false);
    }
  }

  public abstract base: ChainBase;

  public networkStatus: ApiStatus = ApiStatus.Disconnected;

  public readonly meta: z.infer<typeof ExtendedCommunity>;
  public readonly block: IBlockInfo;

  public app: IApp;

  constructor(meta: z.infer<typeof ExtendedCommunity>, app: IApp) {
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
