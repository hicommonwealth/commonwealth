import type { ModalStore } from 'controllers/app/modals';
import { getModalStore } from 'controllers/app/modals';
import type { ToastStore } from 'controllers/app/toasts';
import { getToastStore } from 'controllers/app/toasts';
import ChainEntityController from 'controllers/server/chain_entities';
import DiscordController from 'controllers/server/discord';
import { WebSocketController } from 'controllers/server/socket';
import { EventEmitter } from 'events';
import type { IChainAdapter, NotificationCategory } from 'models';
import type { ChainCategoryAttributes } from 'server/models/chain_category';
import type { ChainCategoryTypeAttributes } from 'server/models/chain_category_type';
import { ChainStore, NodeStore } from 'stores';
import type { InviteCodeAttributes } from 'types';
import RecentActivityController from './controllers/app/recent_activity';
import WebWalletController from './controllers/app/web_wallets';
import ProjectsController from './controllers/chain/ethereum/commonwealth/projects';
import SnapshotController from './controllers/chain/snapshot';
import CommentsController from './controllers/server/comments';
import CommunitiesController from './controllers/server/communities';
import ContractsController from './controllers/server/contracts';
import PollsController from './controllers/server/polls';
import ProfilesController from './controllers/server/profiles';
import ReactionCountsController from './controllers/server/reactionCounts';
import ReactionsController from './controllers/server/reactions';
import { RolesController } from './controllers/server/roles';
import SearchController from './controllers/server/search';
import SessionsController from './controllers/server/sessions';
import ThreadsController from './controllers/server/threads';
import ThreadUniqueAddressesCount from './controllers/server/threadUniqueAddressesCount';
import TopicsController from './controllers/server/topics';
import { UserController } from './controllers/server/user';
import type { MobileMenuName } from './views/app_mobile_menus';
import type { SidebarMenuName } from './views/components/sidebar';

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
  chainEntities: ChainEntityController;

  // XXX: replace this with some app.chain helper
  activeChainId(): string;

  chainPreloading: boolean;
  chainAdapterReady: EventEmitter;
  isAdapterReady: boolean;
  runWhenReady: (cb: () => any) => void;
  chainModuleReady: EventEmitter;
  isModuleReady: boolean;

  // Threads
  threads: ThreadsController;
  threadUniqueAddressesCount: ThreadUniqueAddressesCount;
  comments: CommentsController;
  reactions: ReactionsController;
  reactionCounts: ReactionCountsController;
  polls: PollsController;

  // Search
  search: SearchController;
  searchAddressCache: any;

  // Community
  topics: TopicsController;
  communities: CommunitiesController;

  // Contracts
  contracts: ContractsController;

  // Discord
  discord: DiscordController;

  // User
  user: UserController;
  roles: RolesController;
  recentActivity: RecentActivityController;
  profiles: ProfilesController;
  sessions: SessionsController;

  // Web3
  wallets: WebWalletController;
  snapshot: SnapshotController;
  projects: ProjectsController;

  toasts: ToastStore;
  modals: ModalStore;

  mobileMenu: MobileMenuName;
  sidebarMenu: SidebarMenuName;
  sidebarToggled: boolean;

  loginState: LoginState;
  // stored on server-side
  config: {
    chains: ChainStore;
    nodes: NodeStore;
    notificationCategories?: NotificationCategory[];
    defaultChain: string;
    invites: InviteCodeAttributes[];
    chainCategories?: ChainCategoryAttributes[];
    chainCategoryTypes?: ChainCategoryTypeAttributes[];
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

// INJECT DEPENDENCIES
const user = new UserController();
const roles = new RolesController(user);

// INITIALIZE MAIN APP
const app: IApp = {
  socket: new WebSocketController(),
  chain: null,
  chainEntities: new ChainEntityController(),
  activeChainId: () => app.chain?.id,

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

  // Thread
  threads: ThreadsController.Instance,
  threadUniqueAddressesCount: new ThreadUniqueAddressesCount(),
  comments: new CommentsController(),
  reactions: new ReactionsController(),
  reactionCounts: new ReactionCountsController(),
  polls: new PollsController(),

  // Community
  communities: new CommunitiesController(),
  topics: new TopicsController(),

  // Contracts
  contracts: new ContractsController(),

  // Discord
  discord: new DiscordController(),

  // Search
  search: new SearchController(),
  searchAddressCache: {},

  // Web3
  snapshot: new SnapshotController(),
  wallets: new WebWalletController(),
  projects: new ProjectsController(),

  // User
  user,
  roles,
  recentActivity: new RecentActivityController(),
  profiles: new ProfilesController(),
  sessions: new SessionsController(),
  loginState: LoginState.NotLoaded,

  // Global nav state
  mobileMenu: null,
  sidebarMenu: 'default',
  sidebarToggled: false,

  toasts: getToastStore(),
  modals: getModalStore(),

  config: {
    chains: new ChainStore(),
    nodes: new NodeStore(),
    defaultChain: 'edgeware',
    invites: [],
  },
  // TODO: Collect all getters into an object
  loginStatusLoaded: () => app.loginState !== LoginState.NotLoaded,
  isLoggedIn: () => app.loginState === LoginState.LoggedIn,
  isProduction: () =>
    document.location.origin.indexOf('commonwealth.im') !== -1,
  serverUrl: () => '/api',

  loadingError: null,

  _customDomainId: null,
  isCustomDomain: () => app._customDomainId !== null,
  customDomainId: () => {
    return app._customDomainId;
  },
  setCustomDomain: (d) => {
    app._customDomainId = d;
  },

  _lastNavigatedFrom: null,
  _lastNavigatedBack: false,
  lastNavigatedBack: () => app._lastNavigatedBack,
  lastNavigatedFrom: () => app._lastNavigatedFrom,

  cachedIdentityWidget: null,
};

export default app;
