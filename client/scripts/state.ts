import { ChainStore, OffchainCommunitiesStore, NodeStore } from 'stores';
import {
  ContractCategory,
  IChainAdapter,
  ICommunityAdapter,
  NotificationCategory,
} from 'models';
import { EventEmitter } from 'events';
import { getToastStore, ToastStore } from 'controllers/app/toasts';
import { getModalStore, ModalStore } from 'controllers/app/modals';
import RecentActivityController from './controllers/app/recent_activity';
import ProfilesController from './controllers/server/profiles';
import CommentsController from './controllers/server/comments';
import ThreadsController from './controllers/server/threads';
import SnapshotController from './controllers/chain/snapshot';
import ReactionsController from './controllers/server/reactions';
import WebsocketController from './controllers/server/socket';
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
  socket: WebsocketController;
  chain: IChainAdapter<any, any>;
  community: ICommunityAdapter<any, any>;

  chainPreloading: boolean;
  chainAdapterReady: EventEmitter;
  isAdapterReady: boolean;
  runWhenReady: (cb: () => any) => void;
  chainModuleReady: EventEmitter;
  isModuleReady: boolean;

  profiles: ProfilesController;
  comments: CommentsController;
  threads: ThreadsController;
  snapshot: SnapshotController;
  reactions: ReactionsController;
  topics: TopicsController;
  communities: CommunitiesController;
  user: UserController;
  wallets: WebWalletController;

  recentActivity: RecentActivityController;
  searchCache: any;

  // XXX: replace this with some app.chain helper
  activeChainId(): string;
  activeCommunityId(): string;
  activeId(): string;

  toasts: ToastStore;
  modals: ModalStore;
  loginState: LoginState;
  // stored on server-side
  config: {
    communities: OffchainCommunitiesStore;
    chains: ChainStore;
    nodes: NodeStore;
    contractCategories?: ContractCategory[];
    notificationCategories?: NotificationCategory[];
    defaultChain: string;
    invites: any[];
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
  community: null,

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
  snapshot: new SnapshotController(),
  reactions: new ReactionsController(),
  topics: new TopicsController(),
  communities: new CommunitiesController(),
  user: new UserController(),
  wallets: new WebWalletController(),

  recentActivity: new RecentActivityController(),

  searchCache: {},

  activeChainId: () => app.chain?.id,
  activeCommunityId: () => app.community?.meta.id,
  activeId: () => app.community ? app.activeCommunityId() : app.activeChainId(),

  toasts: getToastStore(),
  modals: getModalStore(),
  loginState: LoginState.NotLoaded,
  config: {
    communities: new OffchainCommunitiesStore(),
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
