import moment from 'moment-twitter';
import { ApiStatus, IApp } from 'state';
import { Coin } from 'adapters/currency';
import { WebsocketMessageType, IWebsocketsPayload } from 'types';
import { clearLocalStorage } from 'stores/PersistentStore';
import $ from 'jquery';

import { CommentRefreshOption } from 'controllers/server/comments';
import ChainEntityController, { EntityRefreshOption } from 'controllers/server/chain_entities';
import { IChainModule, IAccountsModule, IBlockInfo } from './interfaces';
import { ChainBase, ChainClass } from './types';
import { Account, NodeInfo, ChainEntity, ChainEvent } from '.';

// Extended by a chain's main implementation. Responsible for module
// initialization. Saved as `app.chain` in the global object store.
// TODO: move this from `app.chain` or else rename `chain`?
abstract class IChainAdapter<C extends Coin, A extends Account<C>> {
  protected _apiInitialized: boolean = false;
  public get apiInitialized() { return this._apiInitialized; }

  protected _loaded: boolean = false;
  public get loaded() { return this._loaded; }

  public abstract chain: IChainModule<C, A>;
  public abstract accounts: IAccountsModule<C, A>;
  public readonly chainEntities?: ChainEntityController;
  public readonly usingServerChainEntities = false;

  public deferred: boolean;

  protected _serverLoaded: boolean;
  public get serverLoaded() { return this._serverLoaded; }

  private async _postModuleLoad(listenEvents = false): Promise<void> {
    await this.app.comments.refreshAll(this.id, null, CommentRefreshOption.LoadProposalComments);
    // await this.app.reactions.refreshAll(this.id, null, false);

    // attach listener for entity update events
    if (listenEvents) {
      this.app.socket.addListener(
        WebsocketMessageType.ChainEntity,
        (payload: IWebsocketsPayload<any>) => {
          if (!this.chainEntities) {
            return;
          }
          if (!payload || !payload.data || payload.data.chainEntity.chain !== this.meta.chain.id) {
            return;
          }

          const { chainEntity, chainEvent, chainEventType } = payload.data;

          // add fake "include" for construction purposes
          chainEvent.ChainEventType = chainEventType;
          const eventModel = ChainEvent.fromJSON(chainEvent);

          let existingEntity = this.chainEntities.store.get(chainEntity);
          if (!existingEntity) {
            existingEntity = ChainEntity.fromJSON(chainEntity);
          }
          this.chainEntities.update(existingEntity, eventModel);
        }
      );
    }
  }

  public async initServer(): Promise<void> {
    clearLocalStorage();

    // parallel fetch for offchain data and chain entities
    let unused, response;
    if (this.chainEntities) {
      // if we're loading entities from chain, only pull completed
      const refresh = this.usingServerChainEntities
        ? EntityRefreshOption.AllEntities
        : EntityRefreshOption.CompletedEntities;

      [unused, response] = await Promise.all([
        this.chainEntities.refresh(this.meta.chain.id, refresh),
        $.get(`${this.app.serverUrl()}/bulkOffchain`, {
          chain: this.id,
          community: null,
          jwt: this.app.user.jwt,
        })
      ]);
    } else {
      response = await $.get(`${this.app.serverUrl()}/bulkOffchain`, {
        chain: this.id,
        community: null,
        jwt: this.app.user.jwt,
      });
    }

    const { threads, comments, reactions, topics, admins } = response.result;
    this.app.threads.initialize(threads, true);
    this.app.comments.initialize(comments, true);
    this.app.reactions.initialize(reactions, true);
    this.app.topics.initialize(topics, true);
    this.meta.chain.setAdmins(admins);

    this._serverLoaded = true;
  }

  public deinitServer() {
    this._serverLoaded = false;
    this.app.threads.deinit();
    this.app.comments.deinit();
    this.app.reactions.deinit();
    if (this.chainEntities) {
      this.chainEntities.deinit();
    }
  }

  public async initApi(): Promise<void> {
    this._apiInitialized = true;
    console.log(`Started API for ${this.meta.chain.id} on node: ${this.meta.url}.`);
  }

  public async initData(listenEvents = false): Promise<void> {
    await this._postModuleLoad(listenEvents);
    this._loaded = true;
    this.app.chainModuleReady.next(true);
    console.log(`Loaded data for ${this.meta.chain.id} on node: ${this.meta.url}.`);
  }

  public async deinit(): Promise<void> {
    this._apiInitialized = false;
    this._loaded = false;
    console.log(`Stopping ${this.meta.chain.id}...`);
  }

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
