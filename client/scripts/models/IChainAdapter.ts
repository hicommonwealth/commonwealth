import moment from 'moment-twitter';
import { ApiStatus, IApp } from 'state';
import { Coin } from 'adapters/currency';
import { WebsocketMessageType, IWebsocketsPayload } from 'types';
import $ from 'jquery';
import { clearLocalStorage } from 'stores/PersistentStore';

import { CommentRefreshOption } from 'controllers/server/comments';
import { IChainModule, IAccountsModule, IBlockInfo } from './interfaces';
import { ChainBase, ChainClass } from './types';
import { Account, NodeInfo, ChainEntity, ChainEvent } from '.';

// Extended by a chain's main implementation. Responsible for module
// initialization. Saved as `app.chain` in the global object store.
// TODO: move this from `app.chain` or else rename `chain`?
abstract class IChainAdapter<C extends Coin, A extends Account<C>> {
  public abstract loaded: boolean;
  public abstract chain: IChainModule<C, A>;
  public abstract accounts: IAccountsModule<C, A>;

  protected _serverLoaded: boolean;
  get serverLoaded() { return this._serverLoaded; }

  protected async _postModuleLoad(listenEvents = false): Promise<void> {
    await this.app.comments.refreshAll(this.id, null, CommentRefreshOption.LoadProposalComments);
    // await this.app.reactions.refreshAll(this.id, null, false);

    // attach listener for entity update events
    if (listenEvents) {
      this.app.socket.addListener(
        WebsocketMessageType.ChainEntity,
        (payload: IWebsocketsPayload<any>) => {
          if (payload
            && payload.data
            && payload.data.chainEntity.chain === this.meta.chain.id
          ) {
            const { chainEntity, chainEvent, chainEventType } = payload.data;

            // add fake "include" for construction purposes
            chainEvent.ChainEventType = chainEventType;
            const eventModel = ChainEvent.fromJSON(chainEvent);

            let existingEntity = this.app.chainEntities.store.get(chainEntity);
            if (!existingEntity) {
              existingEntity = ChainEntity.fromJSON(chainEntity);
            }
            this.app.chainEntities.update(existingEntity, eventModel);
            this.handleEntityUpdate(existingEntity, eventModel);
          }
        }
      );
    }
  }

  public async init(
    onServerLoaded? : () => void,
    initChainModuleFn?: () => Promise<void>,
    loadIncompleteEntities = false,
  ): Promise<void> {
    clearLocalStorage();
    await this.app.threads.refreshAll(this.id, null, true);
    await this.app.comments.refreshAll(this.id, null, CommentRefreshOption.ResetAndLoadOffchainComments);
    await this.app.reactions.refreshAll(this.id, null, true);
    await this.app.tags.refreshAll(this.id, null, true);

    await $.get(`${this.app.serverUrl()}/bulkMembers`, { chain: this.id, })
      .then((res) => {
        const roles = res.result.filter((r) => { return r.permission === 'admin' || r.permission === 'moderator'; });
        this.app.chain.meta.chain.setAdmins(roles);
      }).catch(() => console.log('Failed to fetch admins/mods'));

    // if we're loading entities from chain, only pull completed
    await this.app.chainEntities.refresh(this.meta.chain.id, loadIncompleteEntities);
    this._serverLoaded = true;
    if (onServerLoaded) await onServerLoaded();
    await initChainModuleFn();
    this.app.chainModuleReady.next(true);
  }

  public async deinit(): Promise<void> {
    this._serverLoaded = false;
    this.app.threads.deinit();
    this.app.comments.deinit();
    this.app.reactions.deinit();
    this.app.chainEntities.deinit();
  }

  public abstract handleEntityUpdate(entity: ChainEntity, event: ChainEvent): void;

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
