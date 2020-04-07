import { ChainStore, OffchainCommunitiesStore, NodeStore } from 'stores';
import {
  NodeInfo,
  AddressInfo,
  MembershipInfo,
  SocialAccount,
  OffchainTag,
  ContractCategory,
  Account,
  IChainAdapter,
  ICommunityAdapter,
  NotificationCategory
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

  chainReady: ReplaySubject<boolean>;

  profiles: ProfilesController;
  comments: CommentsController;
  threads: ThreadsController;
  reactions: ReactionsController;

  // XXX: replace this with some app.chain helper
  activeChainId(): string;
  activeCommunityId(): string;
  activeId(): string;
  defaultScope(): string;

  toasts: ToastStore;
  modals: ModalStore;
  loginState: LoginState;
  login: {
    email?: string;
    jwt?: string;
    addresses: AddressInfo[];
    memberships: MembershipInfo[];
    activeAddresses: Array<Account<any>>;
    socialAccounts: SocialAccount[];
    selectedNode: NodeInfo;
    isSiteAdmin: boolean;
    disableRichText: boolean;
    notifications: NotificationsController;
    lastVisited: object;
    unseenPosts: object;
  };
  config: {
    communities: OffchainCommunitiesStore;
    chains: ChainStore;
    nodes: NodeStore;
    contractCategories?: ContractCategory[];
    notificationCategories?: NotificationCategory[];
    defaultChain: string;
    invites: any[];
  };
  vm: {
    activeAccount: Account<any>;
  };
  loginStatusLoaded(): boolean;
  isLoggedIn(): boolean;
  isProduction(): boolean;
  serverUrl(): string;
}

const app: IApp = {
  socket: null,
  chain: null,
  community: null,

  chainReady: new ReplaySubject(1),

  profiles: new ProfilesController(),
  comments: new CommentsController(),
  threads: new ThreadsController(),
  reactions: new ReactionsController(),

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
    memberships: [],
    selectedNode: null,
    isSiteAdmin: false,
    disableRichText: null,
    lastVisited: {},
    unseenPosts: {},
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
  serverUrl: () => '/api'
};

export default app;
