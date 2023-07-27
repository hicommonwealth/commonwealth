import type { Coin } from 'adapters/currency';
import type { ChainBase } from 'common-common/src/types';
import $ from 'jquery';

import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import { clearLocalStorage } from 'stores/PersistentStore';
import { setDarkMode } from '../helpers/darkMode';
import Account from './Account';
import type ChainInfo from './ChainInfo';
import type {
  IAccountsModule,
  IBlockInfo,
  IChainModule,
  IGatedTopic,
} from './interfaces';
import ProposalModule from './ProposalModule';
import BN from 'bn.js';

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
  public abstract accounts: IAccountsModule<C, A>;
  public readonly communityBanner?: string;

  protected _serverLoaded: boolean;
  public get serverLoaded() {
    return this._serverLoaded;
  }

  public async initServer(): Promise<boolean> {
    clearLocalStorage();
    console.log(`Starting ${this.meta.name}`);
    const [response] = await Promise.all([
      // this.app.chainEntities.refresh(this.meta.id),
      $.get(`${this.app.serverUrl()}/bulkOffchain`, {
        chain: this.id,
        community: null,
        jwt: this.app.user.jwt,
      }),
    ]);

    const darkModePreferenceSet = localStorage.getItem('user-dark-mode-state');
    if (this.meta.id === '1inch') {
      darkModePreferenceSet
        ? setDarkMode(darkModePreferenceSet === 'on')
        : setDarkMode(true);
    }

    const {
      pinnedThreads,
      admins,
      activeUsers,
      numVotingThreads,
      numTotalThreads,
      communityBanner,
      contractsWithTemplatesData,
      gateStrategies,
    } = response.result;
    this.app.threads.initialize(
      pinnedThreads,
      numVotingThreads,
      numTotalThreads,
      true
    );
    this.meta.setAdmins(admins);
    this.app.recentActivity.setMostActiveUsers(activeUsers);
    this.meta.setBanner(communityBanner);
    this.app.contracts.initialize(contractsWithTemplatesData, true);
    if (gateStrategies.length > 0) {
      this.gatedTopics = gateStrategies;
    }

    await this.app.recentActivity.getRecentTopicActivity(this.id);

    if (!this.app.threadUniqueAddressesCount.getInitializedPinned()) {
      this.app.threadUniqueAddressesCount.fetchThreadsUniqueAddresses({
        threads: this.app.threads.listingStore.getPinnedThreads(),
        chain: this.meta.id,
        pinned: true,
      });
    }

    this._serverLoaded = true;
    return true;
  }

  public deinitServer() {
    this._serverLoaded = false;
    this.app.threads.deinit();
    this.app.comments.deinit();
    this.app.comments.deinitReactionsStore();
    if (this.app.chainEntities) {
      this.app.chainEntities.deinit();
    }
    this.app.comments.deinitReactionCountsStore();
    this.app.threadUniqueAddressesCount.deinit();
    console.log(`${this.meta.name} stopped`);
  }

  public async initApi(): Promise<void> {
    this._apiInitialized = true;
    console.log(
      `Started API for ${this.meta.id} on node: ${this.meta.node?.url}.`
    );
  }

  public async initData(): Promise<void> {
    this._loaded = true;
    this.app.chainModuleReady.emit('ready');
    this.app.isModuleReady = true;
    console.log(
      `Loaded data for ${this.meta.id} on node: ${this.meta.node?.url}.`
    );
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

  public async loadModules(modules: ProposalModule<any, any, any>[]) {
    if (!this.loaded) {
      throw new Error('secondary loading cmd called before chain load');
    }
    // TODO: does this need debouncing?
    if (modules.some((mod) => !!mod && !mod.initializing && !mod.ready)) {
      await Promise.all(
        modules.map((mod) => mod.init(this.chain, this.accounts))
      );
      this.app.chainModuleReady.emit('ready');
    }
  }

  public getTopicThreshold(topicId: number): BN {
    if (this.gatedTopics?.length > 0 && topicId) {
      const topicGate = this.gatedTopics.find((i) => i.id === topicId);

      if (!topicGate) return new BN('0', 10);

      return new BN(topicGate.data.threshold);
    }
    return new BN('0', 10);
  }

  public isGatedTopic(topicId: number): boolean {
    const tokenPostingThreshold = this.getTopicThreshold(topicId);
    if (
      !tokenPostingThreshold.isZero() &&
      !this.app.user.activeAccount?.tokenBalance
    )
      return true;
    return (
      !tokenPostingThreshold.isZero() &&
      tokenPostingThreshold.gt(this.app.user.activeAccount.tokenBalance)
    );
  }

  public abstract base: ChainBase;

  public networkStatus: ApiStatus = ApiStatus.Disconnected;
  public networkError: string;

  public readonly meta: ChainInfo;
  public readonly block: IBlockInfo;

  public app: IApp;
  public version: string;
  public name: string;
  public runtimeName: string;
  public gatedTopics: IGatedTopic[];

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
