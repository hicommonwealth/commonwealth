import axios from 'axios';
import { updateActiveUser } from 'controllers/app/login';
import CosmosAccount from 'controllers/chain/cosmos/account';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { NearAccount } from 'controllers/chain/near/account';
import SnapshotController from 'controllers/chain/snapshot';
import SolanaAccount from 'controllers/chain/solana/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import DiscordController from 'controllers/server/discord';
import { EventEmitter } from 'events';
import ChainInfo from 'models/ChainInfo';
import type IChainAdapter from 'models/IChainAdapter';
import { queryClient, QueryKeys, SERVER_URL } from 'state/api/config';
import { Configuration, fetchCustomDomainQuery } from 'state/api/configuration';
import { fetchNodesQuery } from 'state/api/nodes';
import { errorStore } from 'state/ui/error';
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

  // Discord
  discord: DiscordController;

  // Web3
  snapshot: SnapshotController;

  sidebarRedraw: EventEmitter;
}

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

  // Discord
  discord: new DiscordController(),

  // Web3
  snapshot: new SnapshotController(),

  // Global nav state
  sidebarRedraw: new EventEmitter(),
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
    await fetchCustomDomainQuery();

    queryClient.setQueryData([QueryKeys.CONFIGURATION], {
      enforceSessionKeys: statusRes.result.enforceSessionKeys,
      evmTestEnv: statusRes.result.evmTestEnv,
    });

    // store community redirect's map in configuration cache
    const communityWithRedirects =
      statusRes.result?.communityWithRedirects || [];
    if (communityWithRedirects.length > 0) {
      communityWithRedirects.map(({ id, redirect }) => {
        const cachedConfig = queryClient.getQueryData<Configuration>([
          QueryKeys.CONFIGURATION,
        ]);

        queryClient.setQueryData([QueryKeys.CONFIGURATION], {
          ...cachedConfig,
          redirects: {
            ...cachedConfig?.redirects,
            [redirect]: id,
          },
        });
      });
    }

    // it is either user object or undefined
    const userResponse = statusRes.result.user;

    // update the login status
    updateActiveUser(userResponse);

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
    errorStore
      .getState()
      .setLoadingError(
        err.response?.data?.error || 'Error loading application state',
      );
    throw err;
  }
}

export default app;
