import { ChainBase, ChainNetwork, ChainType } from '@hicommonwealth/shared';
import { updateActiveAddresses } from 'controllers/app/login';
import app, { ApiStatus } from 'state';
import ChainInfo from '../models/ChainInfo';

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

  // @ts-expect-error StrictNullChecks
  app.user.setSelectedCommunity(null);
  app.user.setActiveAccounts([]);
  // @ts-expect-error StrictNullChecks
  app.user.ephemerallySetActiveAccount(null);
  document.title = 'Common';
};

// called by the user, when clicking on the chain/node switcher menu
// returns a boolean reflecting whether initialization of chain via the
// initChain fn ought to proceed or abort
export const selectCommunity = async (chain?: ChainInfo): Promise<boolean> => {
  // Select the default node, if one wasn't provided
  if (!chain) {
    if (app.user.selectedCommunity) {
      chain = app.user.selectedCommunity;
    } else {
      chain = app.config.chains.getById(app.config.defaultChain);
    }

    if (!chain) {
      throw new Error('no chain available');
    }
  }

  // Check for valid chain selection, and that we need to switch
  if (app.chain && chain === app.chain.meta) {
    // @ts-expect-error StrictNullChecks
    return;
  }

  // This is a bandaid fix used to stop chain deinit on navigation from createCommunities page. Should be removed.
  if (!app.skipDeinitChain) {
    await deinitChainOrCommunity();
    app.skipDeinitChain = false;
  }
  app.chainPreloading = true;
  document.title = `Common – ${chain.name}`;

  // Import top-level chain adapter lazily, to facilitate code split.
  let newChain;

  if (chain.base === ChainBase.Substrate) {
    const Substrate = (await import('../controllers/chain/substrate/adapter'))
      .default;
    newChain = new Substrate(chain, app);
  } else if (chain.base === ChainBase.CosmosSDK) {
    const Cosmos = (await import('../controllers/chain/cosmos/adapter'))
      .default;
    newChain = new Cosmos(chain, app);
  } else if (chain.network === ChainNetwork.Compound) {
    const Compound = (
      await import('../controllers/chain/ethereum/compound/adapter')
    ).default;
    newChain = new Compound(chain, app);
  } else if (chain.network === ChainNetwork.Aave) {
    const Aave = (await import('../controllers/chain/ethereum/aave/adapter'))
      .default;
    newChain = new Aave(chain, app);
  } else if (
    chain.base === ChainBase.Solana ||
    chain.network === ChainNetwork.SPL
  ) {
    const Solana = (await import('../controllers/chain/solana/adapter'))
      .default;
    newChain = new Solana(chain, app);
  } else if (
    (chain.base === ChainBase.Ethereum && chain.type === ChainType.Offchain) ||
    chain.network === ChainNetwork.Ethereum ||
    chain.network === ChainNetwork.ERC721 ||
    chain.network === ChainNetwork.ERC20
  ) {
    const Ethereum = (await import('../controllers/chain/ethereum/adapter'))
      .default;
    newChain = new Ethereum(chain, app);
  } else {
    throw new Error('Invalid chain');
  }

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
  await updateActiveAddresses({ chain });

  // Update default on server if logged in
  if (app.isLoggedIn()) {
    await app.user.selectCommunity({
      community: chain.id,
    });
  }

  return true;
};

// Initializes a selected chain. Requires `app.chain` to be defined and valid
// and not already initialized.
export const initChain = async (): Promise<void> => {
  if (!app.chain || !app.chain.meta || app.chain.loaded) {
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
  await updateActiveAddresses({ chain });
};
