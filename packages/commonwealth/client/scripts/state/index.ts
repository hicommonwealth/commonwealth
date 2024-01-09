import { Capacitor } from '@capacitor/core';
import { ChainCategoryType } from '@hicommonwealth/core';
import axios from 'axios';
import { updateActiveUser } from 'controllers/app/login';
import RecentActivityController from 'controllers/app/recent_activity';
import CosmosAccount from 'controllers/chain/cosmos/account';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { NearAccount } from 'controllers/chain/near/account';
import SnapshotController from 'controllers/chain/snapshot';
import SolanaAccount from 'controllers/chain/solana/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import ContractsController from 'controllers/server/contracts';
import DiscordController from 'controllers/server/discord';
import PollsController from 'controllers/server/polls';
import { RolesController } from 'controllers/server/roles';
import SearchController from 'controllers/server/search';
import SessionsController from 'controllers/server/sessions';
import { UserController } from 'controllers/server/user';
import { EventEmitter } from 'events';
import ChainInfo from 'models/ChainInfo';
import type IChainAdapter from 'models/IChainAdapter';
import NodeInfo from 'models/NodeInfo';
import NotificationCategory from 'models/NotificationCategory';
import StarredCommunity from 'models/StarredCommunity';
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
  chain: IChainAdapter<
    any,
    | CosmosAccount
    | EthereumAccount
    | NearAccount
    | SolanaAccount
    | SubstrateAccount
  >;

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
    enforceSessionKeys?: boolean;
    chainCategoryMap?: { [chain: string]: ChainCategoryType[] };
  };

  loginStatusLoaded(): boolean;

  isLoggedIn(): boolean;

  isProduction(): boolean;

  isDesktopApp(win): boolean;

  isNative(win): boolean;

  serverUrl(): string;

  platform(): string;

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
  chain: null,
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
  isDesktopApp: (window) => {
    return window.todesktop;
  },
  platform: () => {
    // Using Desktop API to determine if the platform is desktop
    if (app.isDesktopApp(window)) {
      return 'desktop';
    } else {
      // If not desktop, get the platform from Capacitor
      return Capacitor.getPlatform();
    }
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
  shouldRedraw = true,
): Promise<void> {
  try {
    const [
      { data: statusRes },
      { data: communitiesWithSnapshotsRes },
      { data: nodesRes },
    ] = await Promise.all([
      axios.get(`${app.serverUrl()}/status`),
      axios.get(`${app.serverUrl()}/communities?snapshots=true`),
      axios.get(`${app.serverUrl()}/nodes`),
    ]);

    app.config.chains.clear();
    app.config.nodes.clear();
    app.user.notifications.clear();
    app.user.notifications.clearSubscriptions();
    app.config.evmTestEnv = statusRes.result.evmTestEnv;
    app.config.enforceSessionKeys = statusRes.result.enforceSessionKeys;

    nodesRes.result
      .sort((a, b) => a.id - b.id)
      .forEach((node) => {
        app.config.nodes.add(NodeInfo.fromJSON(node));
      });

    communitiesWithSnapshotsRes.result
      .filter((chainsWithSnapshots) => chainsWithSnapshots.community.active)
      .forEach((chainsWithSnapshots) => {
        delete chainsWithSnapshots.community.ChainNode;
        app.config.chains.add(
          ChainInfo.fromJSON({
            ChainNode: app.config.nodes.getById(
              chainsWithSnapshots.community.chain_node_id,
            ),
            snapshot: chainsWithSnapshots.snapshot,
            ...chainsWithSnapshots.community,
          }),
        );
      });

    app.roles.setRoles(statusRes.result.roles);
    app.config.notificationCategories =
      statusRes.result.notificationCategories.map((json) =>
        NotificationCategory.fromJSON(json),
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
      app.user.notifications.refresh();
      if (shouldRedraw) {
        app.loginStateEmitter.emit('redraw');
      }
    } else if (app.loginState === LoginState.LoggedOut && shouldRedraw) {
      app.loginStateEmitter.emit('redraw');
    }

    app.user.setStarredCommunities(
      statusRes.result.user?.starredCommunities
        ? statusRes.result.user?.starredCommunities.map(
            (c) => new StarredCommunity(c),
          )
        : [],
    );
    // update the selectedChain, unless we explicitly want to avoid
    // changing the current state (e.g. when logging in through link_new_address_modal)
    if (
      updateSelectedChain &&
      statusRes.result.user &&
      statusRes.result.user.selectedChain
    ) {
      app.user.setSelectedChain(
        ChainInfo.fromJSON(statusRes.result.user.selectedChain),
      );
    }
  } catch (err) {
    app.loadingError =
      err.response?.data?.error || 'Error loading application state';
    throw err;
  }
}

export default app;
