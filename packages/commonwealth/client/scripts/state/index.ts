import axios from 'axios';
import { updateActiveUser } from 'controllers/app/login';
import RecentActivityController from 'controllers/app/recent_activity';
import CosmosAccount from 'controllers/chain/cosmos/account';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { NearAccount } from 'controllers/chain/near/account';
import SnapshotController from 'controllers/chain/snapshot';
import SolanaAccount from 'controllers/chain/solana/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import DiscordController from 'controllers/server/discord';
import PollsController from 'controllers/server/polls';
import { UserController } from 'controllers/server/user';
import { EventEmitter } from 'events';
import ChainInfo from 'models/ChainInfo';
import type IChainAdapter from 'models/IChainAdapter';
import StarredCommunity from 'models/StarredCommunity';
import { queryClient, QueryKeys } from 'state/api/config';
import { Configuration } from 'state/api/configuration';
import { fetchNodesQuery } from 'state/api/nodes';
import { ChainStore } from 'stores';
import { userStore } from './ui/user';

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

  // Discord
  discord: DiscordController;

  // User
  user: UserController;
  recentActivity: RecentActivityController;

  // Web3
  snapshot: SnapshotController;

  sidebarRedraw: EventEmitter;

  loginState: LoginState;
  loginStateEmitter: EventEmitter;

  // stored on server-side
  config: {
    chains: ChainStore;
  };

  loginStatusLoaded(): boolean;

  isLoggedIn(): boolean;

  serverUrl(): string;

  loadingError: string;

  _customDomainId: string;

  isCustomDomain(): boolean;

  customDomainId(): string;

  setCustomDomain(d: string): void;
}

// INJECT DEPENDENCIES
const user = new UserController();

// INITIALIZE MAIN APP
const app: IApp = {
  // @ts-expect-error StrictNullChecks
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

  // Discord
  discord: new DiscordController(),

  // Web3
  snapshot: new SnapshotController(),

  // User
  user,
  recentActivity: new RecentActivityController(),
  loginState: LoginState.NotLoaded,
  loginStateEmitter: new EventEmitter(),

  // Global nav state
  sidebarRedraw: new EventEmitter(),

  config: {
    chains: new ChainStore(),
  },
  // TODO: Collect all getters into an object
  loginStatusLoaded: () => app.loginState !== LoginState.NotLoaded,
  isLoggedIn: () => app.loginState === LoginState.LoggedIn,
  serverUrl: () => {
    return '/api';
  },

  // @ts-expect-error StrictNullChecks
  loadingError: null,

  // @ts-expect-error StrictNullChecks
  _customDomainId: null,
  isCustomDomain: () => app._customDomainId !== null,
  customDomainId: () => {
    return app._customDomainId;
  },
  setCustomDomain: (d) => {
    app._customDomainId = d;
  },
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
    const [{ data: statusRes }, { data: communities }] = await Promise.all([
      axios.get(`${app.serverUrl()}/status`),
      axios.get(`${app.serverUrl()}/communities`),
    ]);

    const nodesData = await fetchNodesQuery();

    app.config.chains.clear();
    app.user.notifications.clear();
    app.user.notifications.clearSubscriptions();

    queryClient.setQueryData([QueryKeys.CONFIGURATION], {
      enforceSessionKeys: statusRes.result.enforceSessionKeys,
      evmTestEnv: statusRes.result.evmTestEnv,
    });

    communities.result
      .filter((c) => c.community.active)
      .forEach((c) => {
        const chainInfo = ChainInfo.fromJSON({
          ChainNode: nodesData.find((n) => n.id === c.community.chain_node_id),
          ...c.community,
        });
        app.config.chains.add(chainInfo);

        if (chainInfo.redirect) {
          const cachedConfig = queryClient.getQueryData<Configuration>([
            QueryKeys.CONFIGURATION,
          ]);

          queryClient.setQueryData([QueryKeys.CONFIGURATION], {
            ...cachedConfig,
            redirects: {
              ...cachedConfig?.redirects,
              [chainInfo.redirect]: chainInfo.id,
            },
          });
        }
      });

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

    userStore.getState().setData({
      starredCommunities: (statusRes.result.user?.starredCommunities || []).map(
        (c) => new StarredCommunity(c),
      ),
    });
    // update the selectedCommunity, unless we explicitly want to avoid
    // changing the current state (e.g. when logging in through link_new_address_modal)
    if (
      updateSelectedCommunity &&
      statusRes.result.user &&
      statusRes.result.user.selectedCommunity
    ) {
      userStore.getState().setData({
        activeCommunity: ChainInfo.fromJSON(
          statusRes.result.user.selectedCommunity,
        ),
      });
    }

    if (statusRes.result.user) {
      try {
        window.FS('setIdentity', {
          uid: statusRes.result.user.id,
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
