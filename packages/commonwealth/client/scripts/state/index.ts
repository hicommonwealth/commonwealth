import { CommunityCategoryType } from '@hicommonwealth/shared';
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
    redirects: Record<string, string>;
    nodes: NodeStore;
    notificationCategories?: NotificationCategory[];
    defaultChain: string;
    evmTestEnv?: string;
    enforceSessionKeys?: boolean;
    chainCategoryMap?: { [chain: string]: CommunityCategoryType[] };
  };

  loginStatusLoaded(): boolean;

  isLoggedIn(): boolean;

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
    redirects: {},
    nodes: new NodeStore(),
    defaultChain: 'edgeware',
  },
  // TODO: Collect all getters into an object
  loginStatusLoaded: () => app.loginState !== LoginState.NotLoaded,
  isLoggedIn: () => app.loginState === LoginState.LoggedIn,
  serverUrl: () => {
    return '/api';
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
//allows for FS.identify to be used
declare const window: any;
// On login: called to initialize the logged-in state, available chains, and other metadata at /api/status
// On logout: called to reset everything
export async function initAppState(
  updateSelectedCommunity = true,
  shouldRedraw = true,
): Promise<void> {
  try {
    const [{ data: statusRes }, { data: communities }, { data: nodesRes }] =
      await Promise.all([
        axios.get(`${app.serverUrl()}/status`),
        axios.get(`${app.serverUrl()}/communities`),
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

    communities.result
      .filter((c) => c.community.active)
      .forEach((c) => {
        const chainInfo = ChainInfo.fromJSON({
          ChainNode: app.config.nodes.getById(c.community.chain_node_id),
          ...c.community,
        });
        app.config.chains.add(chainInfo);
        if (chainInfo.redirect) {
          app.config.redirects[chainInfo.redirect] = chainInfo.id;
        }
      });

    app.roles.setRoles(statusRes.result.roles);
    app.config.notificationCategories =
      statusRes.result.notificationCategories.map((json) =>
        NotificationCategory.fromJSON(json),
      );
    app.config.chainCategoryMap = statusRes.result.communityCategoryMap;

    // add recentActivity
    const { recentThreads } = statusRes.result;
    recentThreads.forEach(({ communityId, count }) => {
      app.recentActivity.setCommunityThreadCounts(communityId, count);
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
    // update the selectedCommunity, unless we explicitly want to avoid
    // changing the current state (e.g. when logging in through link_new_address_modal)
    if (
      updateSelectedCommunity &&
      statusRes.result.user &&
      statusRes.result.user.selectedCommunity
    ) {
      app.user.setSelectedCommunity(
        ChainInfo.fromJSON(statusRes.result.user.selectedCommunity),
      );
    }

    if (statusRes.result.user) {
      try {
        window.FS('setIdentity', {
          uid: statusRes.result.user.profileId,
        });
      } catch (e) {
        console.error('FullStory not found.');
      }
    }
  } catch (err) {
    app.loadingError =
      err.response?.data?.error || 'Error loading application state';
    throw err;
  }
}

export default app;
