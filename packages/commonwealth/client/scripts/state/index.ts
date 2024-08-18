import axios from 'axios';
import { updateActiveUser } from 'controllers/app/login';
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
import { queryClient, QueryKeys, SERVER_URL } from 'state/api/config';
// TODO: 2617, need a way make this query somewhere else and get the redirected communities list
// ATM communities with id redirect will be broken
// import { Configuration } from 'state/api/configuration';
import { fetchNodesQuery } from 'state/api/nodes';
import { userStore } from './ui/user';

export enum ApiStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
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

  // Web3
  snapshot: SnapshotController;

  sidebarRedraw: EventEmitter;

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

  // Global nav state
  sidebarRedraw: new EventEmitter(),

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
): Promise<void> {
  try {
    const [{ data: statusRes }] = await Promise.all([
      axios.get(`${SERVER_URL}/status`),
    ]);

    await fetchNodesQuery();

    app.user.notifications.clear();
    app.user.notifications.clearSubscriptions();

    queryClient.setQueryData([QueryKeys.CONFIGURATION], {
      enforceSessionKeys: statusRes.result.enforceSessionKeys,
      evmTestEnv: statusRes.result.evmTestEnv,
    });

    // it is either user object or undefined
    const userResponse = statusRes.result.user;

    // update the login status
    updateActiveUser(userResponse);

    if (userResponse) {
      await app.user.notifications.refresh();
    }

    userStore.getState().setData({
      communities: (userResponse?.communities || []).map((c) => ({
        id: c.id || '',
        iconUrl: c.icon_url || '',
        name: c.name || '',
        isStarred: c.is_starred || false,
      })),
    });
    // update the selectedCommunity, unless we explicitly want to avoid
    // changing the current state (e.g. when logging in through link_new_address_modal)
    if (updateSelectedCommunity && userResponse?.selectedCommunity) {
      userStore.getState().setData({
        activeCommunity: ChainInfo.fromJSON(userResponse?.selectedCommunity),
      });
    }

    if (userResponse) {
      try {
        window.FS('setIdentity', {
          uid: userResponse.id,
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
