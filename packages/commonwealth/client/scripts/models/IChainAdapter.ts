import moment from 'moment';
import { ApiStatus, IApp, LoginState } from 'state';
import { Coin } from 'adapters/currency';
import { clearLocalStorage } from 'stores/PersistentStore';
import $ from 'jquery';
import m from 'mithril';
import { ChainBase } from 'common-common/src/types';

import ChainEntityController, {
  EntityRefreshOption,
} from 'controllers/server/chain_entities';
import { IChainModule, IAccountsModule, IBlockInfo } from './interfaces';
import { Account, NodeInfo, ProposalModule } from '.';
import ChainInfo from './ChainInfo';
import { WebSocketController } from '../controllers/server/socket';

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
  public readonly chainEntities?: ChainEntityController;
  public readonly usingServerChainEntities = false;
  public readonly communityBanner?: string;

  public deferred: boolean;

  protected _serverLoaded: boolean;
  public get serverLoaded() {
    return this._serverLoaded;
  }

  public async initServer(): Promise<boolean> {
    clearLocalStorage();
    console.log(`Starting ${this.meta.name}`);
    let response;
    if (this.chainEntities) {
      // if we're loading entities from chain, only pull completed
      const refresh = this.usingServerChainEntities
        ? EntityRefreshOption.AllEntities
        : EntityRefreshOption.CompletedEntities;

      [, response] = await Promise.all([
        this.chainEntities.refresh(this.meta.id, refresh),
        $.get(`${this.app.serverUrl()}/bulkOffchain`, {
          chain: this.id,
          community: null,
          jwt: this.app.user.jwt,
        }),
      ]);
    } else {
      [response, ] = await Promise.all([
        $.get(`${this.app.serverUrl()}/bulkOffchain`, {
          chain: this.id,
          community: null,
          jwt: this.app.user.jwt,
        }),
      ]);
    }

    // If user is no longer on the initializing chain, abort initialization
    // and return false, so that the invoking selectChain fn can similarly
    // break, rather than complete.
    if (
      this.meta.id !== (this.app.customDomainId() || m.route.param('scope'))
    ) {
      return false;
    }

    const {
      pinnedThreads,
      topics,
      admins,
      activeUsers,
      numVotingThreads,
      chatChannels,
      rules, // TODO: store in rules controller
      communityBanner,
      contracts,
      communityRoles,
    } = response.result;
    this.app.topics.initialize(topics, true);
    this.app.threads.initialize(pinnedThreads, numVotingThreads, true);
    this.meta.setAdmins(admins);
    this.app.recentActivity.setMostActiveUsers(activeUsers);
    this.meta.setBanner(communityBanner);
    this.app.contracts.initialize(contracts, true);

    // add community roles to the chain's roles
    this.meta.communityRoles = communityRoles;

    await this.app.recentActivity.getRecentTopicActivity(this.id);

    // parse/save the chat channels
    await this.app.socket.chatNs.refreshChannels(JSON.parse(chatChannels));

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
    this.app.reactions.deinit();
    if (this.chainEntities) {
      this.chainEntities.deinit();
    }
    this.app.reactionCounts.deinit();
    this.app.threadUniqueAddressesCount.deinit();
    if (this.app.socket) this.app.socket.chatNs.deinit();
    console.log(`${this.meta.name} stopped`);
  }

  public async initApi(): Promise<void> {
    this._apiInitialized = true;
    console.log(
      `Started API for ${this.meta.id} on node: ${this.meta.node.url}.`
    );
  }

  public async initData(): Promise<void> {
    this._loaded = true;
    this.app.chainModuleReady.emit('ready');
    this.app.isModuleReady = true;
    console.log(
      `Loaded data for ${this.meta.id} on node: ${this.meta.node.url}.`
    );
  }

  public async deinit(): Promise<void> {
    this._apiInitialized = false;
    this.app.isModuleReady = false;
    if (this.app.snapshot) this.app.snapshot.deinit();
    this._loaded = false;
    console.log(`Stopping ${this.meta.id}...`);
  }

  public async loadModules(modules: ProposalModule<any, any, any>[]) {
    if (!this.loaded) {
      throw new Error('secondary loading cmd called before chain load');
    }
    // TODO: does this need debouncing?
    if (modules.some((mod) => !mod.initializing && !mod.ready)) {
      await Promise.all(
        modules.map((mod) => mod.init(this.chain, this.accounts))
      );
    }
    m.redraw();
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
