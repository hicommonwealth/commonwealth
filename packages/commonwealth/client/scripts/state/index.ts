import { ExtendedCommunity, GetPublicEnvVar } from '@hicommonwealth/schemas';
import { updateActiveUser } from 'controllers/app/login';
import CosmosAccount from 'controllers/chain/cosmos/account';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { NearAccount } from 'controllers/chain/near/account';
import SolanaAccount from 'controllers/chain/solana/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { EventEmitter } from 'events';
import type IChainAdapter from 'models/IChainAdapter';
import {
  fetchCustomDomainQuery,
  fetchPublicEnvVarQuery,
} from 'state/api/configuration';
import { errorStore } from 'state/ui/error';
import { z } from 'zod';
import SuiAccount from '../controllers/chain/sui/account';
import { getCommunityByIdQuery } from './api/communities/getCommuityById';
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
): Promise<z.infer<(typeof GetPublicEnvVar)['output']>> {
  try {
    const [status, publicEnvVars] = await Promise.all([
      fetchStatus(),
      fetchPublicEnvVarQuery(),
      fetchNodes(),
      fetchCustomDomainQuery(),
    ]);

    updateActiveUser(status);
    if (status) {
      // update the selectedCommunity, unless we explicitly want to avoid
      // changing the current state (e.g. when logging in through link_new_address_modal)
      if (updateSelectedCommunity && status?.selected_community_id) {
        userStore.getState().setData({
          // TODO: api should be updated to get relevant data
          activeCommunity: (await getCommunityByIdQuery(
            status.selected_community_id,
            true,
          )) as unknown as z.infer<typeof ExtendedCommunity>,
        });
      }
    }
    return publicEnvVars;
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
