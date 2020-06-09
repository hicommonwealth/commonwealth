import { ChainStore, OffchainCommunitiesStore, NodeStore } from 'stores';
import {
  NodeInfo,
  AddressInfo,
  RoleInfo,
  SocialAccount,
  OffchainTag,
  ContractCategory,
  Account,
  IChainAdapter,
  ICommunityAdapter,
  NotificationCategory,
  StarredCommunity,
} from 'models';
import { getToastStore, ToastStore } from 'controllers/app/toasts';
import { getModalStore, ModalStore } from 'controllers/app/modals';
import { Subject, ReplaySubject } from 'rxjs';
import ProfilesController from './controllers/server/profiles';
import CommentsController from './controllers/server/comments';
import ThreadsController from './controllers/server/threads';
import ReactionsController from './controllers/server/reactions';
import NotificationsController from './controllers/server/notifications';
import WebsocketController from './controllers/server/socket';
import TagsController from './controllers/server/tags';
import ChainEntityController from './controllers/server/chain_entities';
import CommunitiesController from './controllers/server/communities';

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

  chainAdapterReady: ReplaySubject<boolean>;
  chainModuleReady: ReplaySubject<boolean>;

  profiles: ProfilesController;
  comments: CommentsController;
  threads: ThreadsController;
  reactions: ReactionsController;
  tags: TagsController;
  chainEntities: ChainEntityController;
  communities: CommunitiesController;

  // XXX: replace this with some app.chain helper
  activeChainId(): string;
  activeCommunityId(): string;
  activeId(): string;
  defaultScope(): string;

  toasts: ToastStore;
  modals: ModalStore;
  loginState: LoginState;
  // populated on login
  login: {
    email?: string;
    jwt?: string;
    // all address infos for all chains/communities loaded
    addresses: AddressInfo[];
    // contains all role data for every active + non-active address
    // TODO: Turn this into a map, app.login.roles[community] or turn into stores/controllers
    roles: RoleInfo[];
    // active addresses for a specific community or chain
    // TODO: Rename to some accounts based name
    activeAddresses: Array<Account<any>>;
    // TODO: Identify a use-case, implement a use case
    socialAccounts: SocialAccount[];
    selectedNode: NodeInfo;
    isSiteAdmin: boolean;
    disableRichText: boolean;
    notifications: NotificationsController;
    lastVisited: object;
    starredCommunities: StarredCommunity[];
    unseenPosts: object;
  };
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
  // TODO: pull this into login
  vm: {
    activeAccount: Account<any>;
  };
  loginStatusLoaded(): boolean;
  isLoggedIn(): boolean;
  isProduction(): boolean;
  serverUrl(): string;
  loadingError: string;
}

const app: IApp = {
  socket: null,
  chain: null,
  community: null,

  chainAdapterReady: new ReplaySubject(1),
  chainModuleReady: new ReplaySubject(1),

  profiles: new ProfilesController(),
  comments: new CommentsController(),
  threads: new ThreadsController(),
  reactions: new ReactionsController(),
  tags: new TagsController(),
  chainEntities: new ChainEntityController(),
  communities: new CommunitiesController(),

  activeChainId: () => app.chain ? app.chain.id : null,
  activeCommunityId: () => app.community ? app.community.meta.id : null,
  activeId: () => app.community ? app.activeCommunityId() : app.activeChainId(),
  defaultScope: () => app.config.defaultChain,

  toasts: getToastStore(),
  modals: getModalStore(),
  loginState: LoginState.NotLoaded,
  login: {
    addresses: [],
    activeAddresses: [],
    socialAccounts: [],
    roles: [],
    selectedNode: null,
    isSiteAdmin: false,
    disableRichText: null,
    lastVisited: {},
    unseenPosts: {},
    starredCommunities: [],
    notifications: new NotificationsController(),
  },
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
  // TODO: Remove VM property, migrate activeAccount to app.login
  vm: {
    activeAccount: null,
  },
  serverUrl: () => '/api',
  loadingError: null,
};

export default app;
