import { ChainStore, NodeStore } from 'stores';
import {
  ContractCategory,
  IChainAdapter,
  NotificationCategory,
} from 'models';
import { EventEmitter } from 'events';
import { getToastStore, ToastStore } from 'controllers/app/toasts';
import { getModalStore, ModalStore } from 'controllers/app/modals';
import { InviteCodeAttributes } from 'types';
import { WebSocketController } from 'controllers/server/socket';
import RecentActivityController from './controllers/app/recent_activity';
import ProfilesController from './controllers/server/profiles';
import CommentsController from './controllers/server/comments';
import ThreadsController from './controllers/server/threads';
import SnapshotController from './controllers/chain/snapshot';
import SearchController from './controllers/server/search'
import ReactionsController from './controllers/server/reactions';
import ReactionCountsController from './controllers/server/reactionCounts';
import ThreadUniqueAddressesCount from './controllers/server/threadUniqueAddressesCount';
import TopicsController from './controllers/server/topics';
import CommunitiesController from './controllers/server/communities';
import UserController from './controllers/server/user/index';
import WebWalletController from './controllers/app/web_wallets';

export enum ApiStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
}

export const enum LoginState {
  NotLoaded = 'not_loaded',
  LoggedOut = 'logged_out',
  LoggedIn = 'logged_in',
}

export interface IApp {
  socket: WebSocketController;
  chain: IChainAdapter<any, any>;

  chainPreloading: boolean;
  chainAdapterReady: EventEmitter;
  isAdapterReady: boolean;
  runWhenReady: (cb: () => any) => void;
  chainModuleReady: EventEmitter;
  isModuleReady: boolean;

  profiles: ProfilesController;
  comments: CommentsController;
  threads: ThreadsController;
  threadUniqueAddressesCount: ThreadUniqueAddressesCount;
  search: SearchController;
  snapshot: SnapshotController;
  reactions: ReactionsController;
  reactionCounts: ReactionCountsController;
  topics: TopicsController;
  communities: CommunitiesController;
  user: UserController;
  wallets: WebWalletController;

  recentActivity: RecentActivityController;
  searchAddressCache: any;

  // XXX: replace this with some app.chain helper
  activeChainId(): string;

  toasts: ToastStore;
  modals: ModalStore;
  loginState: LoginState;
  // stored on server-side
  config: {
    chains: ChainStore;
    nodes: NodeStore;
    contractCategories?: ContractCategory[];
    notificationCategories?: NotificationCategory[];
    defaultChain: string;
    invites: InviteCodeAttributes[];
  };
  loginStatusLoaded(): boolean;
  isLoggedIn(): boolean;
  isProduction(): boolean;
  serverUrl(): string;
  loadingError: string;

  _customDomainId: string;
  isCustomDomain(): boolean;
  customDomainId(): string;
  setCustomDomain(d: string): void;

  _lastNavigatedBack: boolean;
  _lastNavigatedFrom: string;
  lastNavigatedBack(): boolean;
  lastNavigatedFrom(): string;

  cachedIdentityWidget: any; // lazy loaded substrate identity widget
}

const app: IApp = {
  socket: null,
  chain: null,

  chainPreloading: false,
  chainAdapterReady: new EventEmitter(),
  isAdapterReady: false,
  runWhenReady: (cb) => {
    if (app.isAdapterReady) cb();
    else app.chainAdapterReady.on('ready', cb);
  },
  // need many max listeners because every account will wait on this
  chainModuleReady: new EventEmitter().setMaxListeners(100),
  isModuleReady: false,

  profiles: new ProfilesController(),
  comments: new CommentsController(),
  threads: new ThreadsController(),
  threadUniqueAddressesCount: new ThreadUniqueAddressesCount(),
  search: new SearchController(),
  snapshot: new SnapshotController(),
  reactions: new ReactionsController(),
  reactionCounts: new ReactionCountsController(),
  topics: new TopicsController(),
  communities: new CommunitiesController(),
  user: new UserController(),
  wallets: new WebWalletController(),

  recentActivity: new RecentActivityController(),

  searchAddressCache: {},

  activeChainId: () => app.chain?.id,

  toasts: getToastStore(),
  modals: getModalStore(),
  loginState: LoginState.NotLoaded,
  config: {
    chains: new ChainStore(),
    nodes: new NodeStore(),
    defaultChain: 'edgeware',
    invites: [],
  },
  // TODO: Collect all getters into an object
  loginStatusLoaded: () => app.loginState !== LoginState.NotLoaded,
  isLoggedIn:        () => app.loginState === LoginState.LoggedIn,
  isProduction:      () => document.location.origin.indexOf('commonwealth.im') !== -1,
  serverUrl:         () => '/api',

  loadingError: null,

  _customDomainId: null,
  isCustomDomain: () => app._customDomainId !== null,
  customDomainId: () => { return app._customDomainId; },
  setCustomDomain: (d) => { app._customDomainId = d; },

  _lastNavigatedFrom: null,
  _lastNavigatedBack: false,
  lastNavigatedBack: () => app._lastNavigatedBack,
  lastNavigatedFrom: () => app._lastNavigatedFrom,

  cachedIdentityWidget: null,
};

export default app;
