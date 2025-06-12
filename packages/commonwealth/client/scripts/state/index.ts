import { updateActiveUser } from 'controllers/app/login';
import CosmosAccount from 'controllers/chain/cosmos/account';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { NearAccount } from 'controllers/chain/near/account';
import SolanaAccount from 'controllers/chain/solana/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { EventEmitter } from 'events';
import type IChainAdapter from 'models/IChainAdapter';
import { queryClient, QueryKeys } from 'state/api/config';
import {
  Configuration,
  fetchCustomDomainQuery,
  fetchPublicEnvVar,
} from 'state/api/configuration';
import { errorStore } from 'state/ui/error';
import SuiAccount from '../controllers/chain/sui/account';
import { EXCEPTION_CASE_VANILLA_getCommunityById } from './api/communities/getCommuityById';
import { fetchNodes } from './api/nodes';
import { fetchStatus } from './api/user/fetchStatus';
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
    | SuiAccount
  >;

  // XXX: replace this with some app.chain helper
  activeChainId(): string | undefined;

  chainPreloading: boolean;
  chainAdapterReady: EventEmitter;
  isAdapterReady: boolean;
  runWhenReady: (cb: () => any) => void;
  chainModuleReady: EventEmitter;
  isModuleReady: boolean;
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
};

// On login: called to initialize the logged-in state, available chains, and other metadata
// On logout: called to reset everything
export async function initAppState(
  updateSelectedCommunity = true,
): Promise<void> {
  try {
    await fetchNodes();
    await fetchCustomDomainQuery();
    await fetchPublicEnvVar();

    // set evmTestEnv in configuration cache
    queryClient.setQueryData([QueryKeys.CONFIGURATION], {
      evmTestEnv: {
        ETH_RPC: process.env.TEST_EVM_ETH_RPC,
        PROVIDER_URL: process.env.TEST_EVM_PROVIDER_URL,
      },
    });

    const status = await fetchStatus();
    updateActiveUser(status);
    if (status) {
      // store community redirect's map in configuration cache
      const communityWithRedirects =
        status.communities?.filter((c) => c.redirect) || [];
      if (communityWithRedirects.length > 0) {
        communityWithRedirects.map(({ id, redirect }) => {
          const cachedConfig = queryClient.getQueryData<Configuration>([
            QueryKeys.CONFIGURATION,
          ]);
          queryClient.setQueryData([QueryKeys.CONFIGURATION], {
            ...cachedConfig,
            redirects: {
              ...cachedConfig?.redirects,
              [redirect!]: id,
            },
          });
        });
      }

      // update the selectedCommunity, unless we explicitly want to avoid
      // changing the current state (e.g. when logging in through link_new_address_modal)
      if (updateSelectedCommunity && status?.selected_community_id) {
        userStore.getState().setData({
          // TODO: api should be updated to get relevant data
          activeCommunity: await EXCEPTION_CASE_VANILLA_getCommunityById(
            status.selected_community_id,
            true,
          ),
        });
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
