import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { updateActiveAddresses } from 'controllers/app/login';
import { DEFAULT_CHAIN } from 'helpers/constants';
import app, { ApiStatus } from 'state';
import { z } from 'zod';
import { getCommunityById } from '../state/api/communities/getCommuityById';
import { userStore } from '../state/ui/user';

export const deinitChainOrCommunity = async () => {
  app.isAdapterReady = false;

  if (app.chain) {
    app.chain.networkStatus = ApiStatus.Disconnected;
    app.chain.deinitServer();
    await app.chain.deinit();
    console.log('Finished deinitializing chain');
    // @ts-expect-error StrictNullChecks
    app.chain = null;
  }

  userStore.getState().setData({
    activeCommunity: null,
    accounts: [],
    activeAccount: null,
  });
  document.title = 'Common';
};

// called by the user, when clicking on the chain/node switcher menu
// returns a boolean reflecting whether initialization of chain via the
// initChain fn ought to proceed or abort
export const loadCommunityChainInfo = async (
  chain?: z.infer<typeof ExtendedCommunity>,
): Promise<boolean> => {
  let tempChain = chain;

  // Select the default node, if one wasn't provided
  if (!tempChain) {
    const activeCommunity = userStore.getState().activeCommunity;
    if (activeCommunity) {
      tempChain = activeCommunity;
    } else {
      const communityInfo = await getCommunityById(DEFAULT_CHAIN, true);
      tempChain = communityInfo;
    }

    if (!tempChain) {
      throw new Error('no chain available');
    }
  }

  // Check for valid chain selection, and that we need to switch
  if (app.chain && tempChain === app.chain.meta) {
    // @ts-expect-error StrictNullChecks
    return;
  }

  await deinitChainOrCommunity();
  app.chainPreloading = true;
  document.title = `Common – ${tempChain.name}`;

  // Import top-level chain adapter lazily, to facilitate code split.
  const newChain = await (async (base: ChainBase) => {
    switch (base) {
      case ChainBase.Substrate: {
        const Substrate = (
          await import('../controllers/chain/substrate/adapter')
        ).default;
        return new Substrate(tempChain, app);
      }
      case ChainBase.CosmosSDK: {
        const Cosmos = (await import('../controllers/chain/cosmos/adapter'))
          .default;
        return new Cosmos(tempChain, app);
      }
      case ChainBase.NEAR: {
        const Near = (await import('../controllers/chain/near/adapter'))
          .default;
        return new Near(tempChain, app);
      }
      case ChainBase.Solana: {
        const Solana = (await import('../controllers/chain/solana/adapter'))
          .default;
        return new Solana(tempChain, app);
      }
      case ChainBase.Ethereum: {
        const Ethereum = (await import('../controllers/chain/ethereum/adapter'))
          .default;
        return new Ethereum(tempChain, app);
      }
      default:
        throw new Error('Invalid Chain');
    }
  })(tempChain.base);

  // Load server data without initializing modules/chain connection.
  const finalizeInitialization = await newChain.initServer();

  // If the user is still on the initializing node, finalize the
  // initialization; otherwise, abort, deinit, and return false.
  //
  // Also make sure the state is sufficiently reset so that the
  // next redraw cycle will reinitialize any needed chain.
  if (!finalizeInitialization) {
    console.log('Chain loading aborted');
    app.chainPreloading = false;
    // @ts-expect-error StrictNullChecks
    app.chain = null;
    return false;
  } else {
    app.chain = newChain;
  }

  app.chainPreloading = false;

  // Instantiate active addresses before chain fully loads
  await updateActiveAddresses(chain?.id || '');

  return true;
};

// Initializes a selected chain. Requires `app.chain` to be defined and valid
// and not already initialized.
export const initChain = async (): Promise<void> => {
  if (!app.chain || !app.chain?.meta || app.chain.loaded) {
    return;
  }

  if (!app.chain.apiInitialized) {
    await app.chain.initApi();
  }

  if (!app.chain.loaded) {
    await app.chain.initData();
  }

  const chain = app.chain.meta;

  // Emit chain as updated
  app.chainAdapterReady.emit('ready');
  app.isAdapterReady = true;
  console.log(`${chain.network.toUpperCase()} started.`);

  // Instantiate (again) to create chain-specific Account<> objects
  await updateActiveAddresses(chain.id || '');
};
