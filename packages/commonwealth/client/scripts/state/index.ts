import axios from 'axios';
import { ChainCategoryType } from 'common-common/src/types';
import { updateActiveUser } from 'controllers/app/login';
import RecentActivityController from 'controllers/app/recent_activity';
import SnapshotController from 'controllers/chain/snapshot';
import ChainEntityController from 'controllers/server/chain_entities';
import CommunitiesController from 'controllers/server/communities';
import ContractsController from 'controllers/server/contracts';
import DiscordController from 'controllers/server/discord';
import PollsController from 'controllers/server/polls';
import { RolesController } from 'controllers/server/roles';
import SearchController from 'controllers/server/search';
import SessionsController from 'controllers/server/sessions';
import { WebSocketController } from 'controllers/server/socket';
import { UserController } from 'controllers/server/user';
import { EventEmitter } from 'events';
import $ from 'jquery';
import ChainInfo from 'models/ChainInfo';
import type IChainAdapter from 'models/IChainAdapter';
import NodeInfo from 'models/NodeInfo';
import NotificationCategory from 'models/NotificationCategory';
import { ChainStore, NodeStore } from 'stores';

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

  // Polls
  polls: PollsController;

  // Proposals
  proposalEmitter: EventEmitter;

  // Search
  search: SearchController;
  searchAddressCache: any;

  // Community
  communities: CommunitiesController;

  // Contracts
  contracts: ContractsController;

  // Discord
  discord: DiscordController;

  // User
  user: UserController;
  roles: RolesController;
  recentActivity: RecentActivityController;
  sessions: SessionsController;

  // Web3
  snapshot: SnapshotController;

  sidebarRedraw: EventEmitter;

  loginState: LoginState;
  loginStateEmitter: EventEmitter;

  // stored on server-side
  config: {
    chains: ChainStore;
    nodes: NodeStore;
    notificationCategories?: NotificationCategory[];
    defaultChain: string;
    evmTestEnv?: string;
    chainCategoryMap?: { [chain: string]: ChainCategoryType[] };
  };

  loginStatusLoaded(): boolean;

  isLoggedIn(): boolean;

  isProduction(): boolean;
  isNative(win): boolean;

  serverUrl(): string;

  loadingError: string;

  _customDomainId: string;

  isCustomDomain(): boolean;

  customDomainId(): string;

  setCustomDomain(d: string): void;

  // bandaid fix to skip next deinit chain on layout.tsx transition
  skipDeinitChain: boolean;
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

  // Polls
  polls: new PollsController(),

  // Proposals
  proposalEmitter: new EventEmitter(),

  // Community
  communities: new CommunitiesController(),

  // Contracts
  contracts: new ContractsController(),

  // Discord
  discord: new DiscordController(),

  // Search
  search: new SearchController(),
  searchAddressCache: {},

  // Web3
  snapshot: new SnapshotController(),

  // User
  user,
  roles,
  recentActivity: new RecentActivityController(),
  sessions: new SessionsController(),
  loginState: LoginState.NotLoaded,
  loginStateEmitter: new EventEmitter(),

  // Global nav state
  sidebarRedraw: new EventEmitter(),

  config: {
    chains: new ChainStore(),
    nodes: new NodeStore(),
    defaultChain: 'edgeware',
  },
  // TODO: Collect all getters into an object
  loginStatusLoaded: () => app.loginState !== LoginState.NotLoaded,
  isLoggedIn: () => app.loginState === LoginState.LoggedIn,
  isNative: () => {
    const capacitor = window['Capacitor'];
    return !!(capacitor && capacitor.isNative);
  },
  isProduction: () =>
    document.location.origin.indexOf('commonwealth.im') !== -1,
  serverUrl: () => {
    //* TODO: @ Used to store the webpack SERVER_URL, should only be set for mobile deployments */
    const mobileUrl = 'http://127.0.0.1:8080/api'; // Replace with your computer ip, staging, or production url

    if (app.isNative(window)) {
      return mobileUrl;
    } else {
      return '/api';
    }
  },

  loadingError: null,

  _customDomainId: null,
  isCustomDomain: () => app._customDomainId !== null,
  customDomainId: () => {
    return app._customDomainId;
  },
  setCustomDomain: (d) => {
    app._customDomainId = d;
  },
  skipDeinitChain: false,
};

// On login: called to initialize the logged-in state, available chains, and other metadata at /api/status
// On logout: called to reset everything
export async function initAppState(
  updateSelectedChain = true,
  shouldRedraw = true
): Promise<void> {
  try {
    const [
      { data: statusRes },
      { data: chainsWithSnapshotsRes },
      { data: nodesRes },
    ] = await Promise.all([
      axios.get(`${app.serverUrl()}/status`),
      axios.get(`${app.serverUrl()}/chains?snapshots=true`),
      axios.get(`${app.serverUrl()}/nodes`),
    ]);

    app.config.chains.clear();
    app.config.nodes.clear();
    app.user.notifications.clear();
    app.user.notifications.clearSubscriptions();
    app.config.evmTestEnv = statusRes.result.evmTestEnv;

    nodesRes.result
      .sort((a, b) => a.id - b.id)
      .forEach((node) => {
        app.config.nodes.add(NodeInfo.fromJSON(node));
      });

    chainsWithSnapshotsRes.result
      .filter((chainsWithSnapshots) => chainsWithSnapshots.chain.active)
      .forEach((chainsWithSnapshots) => {
        delete chainsWithSnapshots.chain.ChainNode;
        app.config.chains.add(
          ChainInfo.fromJSON({
            ChainNode: app.config.nodes.getById(
              chainsWithSnapshots.chain.chain_node_id
            ),
            snapshot: chainsWithSnapshots.snapshot,
            ...chainsWithSnapshots.chain,
          })
        );
      });

    app.roles.setRoles(statusRes.result.roles);
    app.config.notificationCategories =
      statusRes.result.notificationCategories.map((json) =>
        NotificationCategory.fromJSON(json)
      );
    app.config.chainCategoryMap = statusRes.result.chainCategoryMap;

    // add recentActivity
    const { recentThreads } = statusRes.result;
    recentThreads.forEach(({ chain, count }) => {
      app.recentActivity.setCommunityThreadCounts(chain, count);
    });

    // update the login status
    updateActiveUser(statusRes.result.user);
    app.loginState = statusRes.result.user
      ? LoginState.LoggedIn
      : LoginState.LoggedOut;

    if (app.loginState === LoginState.LoggedIn) {
      console.log('Initializing socket connection with JTW:', app.user.jwt);
      // init the websocket connection and the chain-events namespace
      app.socket.init(app.user.jwt);
      app.user.notifications.refresh(); // TODO: redraw if needed
      if (shouldRedraw) {
        app.loginStateEmitter.emit('redraw');
      }
    } else if (
      app.loginState === LoginState.LoggedOut &&
      app.socket.isConnected
    ) {
      // TODO: create global deinit function
      app.socket.disconnect();
      if (shouldRedraw) {
        app.loginStateEmitter.emit('redraw');
      }
    }

    app.user.setStarredCommunities(
      statusRes.result.user ? statusRes.result.user.starredCommunities : []
    );
    // update the selectedChain, unless we explicitly want to avoid
    // changing the current state (e.g. when logging in through link_new_address_modal)
    if (
      updateSelectedChain &&
      statusRes.result.user &&
      statusRes.result.user.selectedChain
    ) {
      app.user.setSelectedChain(
        ChainInfo.fromJSON(statusRes.result.user.selectedChain)
      );
    }
  } catch (err) {
    app.loadingError =
      err.responseJSON?.error || 'Error loading application state';
    throw err;
  }
}

export default app;
