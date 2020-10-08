import { ChainStore, OffchainCommunitiesStore, NodeStore } from 'stores';
import {
  ContractCategory,
  IChainAdapter,
  ICommunityAdapter,
  NotificationCategory,
} from 'models';
import { ReplaySubject } from 'rxjs';
import { getToastStore, ToastStore } from 'controllers/app/toasts';
import { getModalStore, ModalStore } from 'controllers/app/modals';
import RecentActivityController from './controllers/app/recent_activity';
import ProfilesController from './controllers/server/profiles';
import CommentsController from './controllers/server/comments';
import ThreadsController from './controllers/server/threads';
import ReactionsController from './controllers/server/reactions';
import WebsocketController from './controllers/server/socket';
import TopicsController from './controllers/server/topics';
import CommunitiesController from './controllers/server/communities';
import UserController from './controllers/server/user/index';

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

interface IRecentActivity {
  activeAddresses;
  activeThreads;
}

export interface IApp {
  socket: WebsocketController;
  chain: IChainAdapter<any, any>;
  community: ICommunityAdapter<any, any>;

  chainPreloading: boolean;
  chainAdapterReady: ReplaySubject<boolean>;
  chainModuleReady: ReplaySubject<boolean>;

  profiles: ProfilesController;
  comments: CommentsController;
  threads: ThreadsController;
  reactions: ReactionsController;
  topics: TopicsController;
  communities: CommunitiesController;
  user: UserController;

  recentActivity: RecentActivityController;

  // XXX: replace this with some app.chain helper
  activeChainId(): string;
  activeCommunityId(): string;
  activeId(): string;
  defaultScope(): string;

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

  _lastNavigatedBack: boolean;
  _lastNavigatedFrom: string;
  lastNavigatedBack(): boolean;
  lastNavigatedFrom(): string;
}

const app: IApp = {
  socket: null,
  chain: null,
  community: null,

  chainPreloading: false,
  chainAdapterReady: new ReplaySubject(1),
  chainModuleReady: new ReplaySubject(1),

  profiles: new ProfilesController(),
  comments: new CommentsController(),
  threads: new ThreadsController(),
  reactions: new ReactionsController(),
  topics: new TopicsController(),
  communities: new CommunitiesController(),
  user: new UserController(),

  recentActivity: new RecentActivityController(),

  activeChainId: () => app.chain ? app.chain.id : null,
  activeCommunityId: () => app.community ? app.community.meta.id : null,
  activeId: () => app.community ? app.activeCommunityId() : app.activeChainId(),
  defaultScope: () => app.config.defaultChain,

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
  loginStatusLoaded: () => {
    return app.loginState !== LoginState.NotLoaded;
  },
  isLoggedIn: () => {
    return app.loginState === LoginState.LoggedIn;
  },
  isProduction: () => {
    return document.location.origin.indexOf('commonwealth.im') !== -1;
  },
  serverUrl: () => '/api',
  loadingError: null,

  _lastNavigatedFrom: null,
  _lastNavigatedBack: false,
  lastNavigatedBack: () => app._lastNavigatedBack,
  lastNavigatedFrom: () => app._lastNavigatedFrom,
};

export default app;
