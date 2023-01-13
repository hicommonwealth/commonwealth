/* eslint-disable @typescript-eslint/ban-types */

import '../styles/normalize.css'; // reset
import '../styles/tailwind_reset.css'; // for the landing page
import '../styles/shared.scss';
import 'construct.scss';
import 'lity/dist/lity.min.css';
import mixpanel from 'mixpanel-browser';

import m from 'mithril';
import $ from 'jquery';
import moment from 'moment';

import './fragment-fix';
import app, { ApiStatus, LoginState } from 'state';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { ChainInfo, NodeInfo, NotificationCategory } from 'models';

import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import { updateActiveAddresses, updateActiveUser } from 'controllers/app/login';

import { ConfirmInviteModal } from 'views/modals/confirm_invite_modal';
import { NewLoginModal } from 'views/modals/login_modal';
import { alertModalWithText } from 'views/modals/alert_modal';
import { getRoutes } from 'router';
import {
  APPLICATION_UPDATE_ACTION,
  APPLICATION_UPDATE_MESSAGE,
  MIXPANEL_DEV_TOKEN,
  MIXPANEL_PROD_TOKEN,
} from 'helpers/constants';
import { isWindowMediumSmallInclusive } from './views/components/component_kit/helpers';

const injectGoogleTagManagerScript = () => {
  const script = document.createElement('noscript');
  m.render(
    script,
    m.trust(
      // eslint-disable-next-line max-len
      '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KRWH69V" height="0" width="0" style="display:none;visibility:hidden"></iframe>'
    )
  );
  document.body.insertBefore(script, document.body.firstChild);
};

const handleWindowError = () => {
  // ignore ResizeObserver error: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
  const resizeObserverLoopErrRe = /^ResizeObserver loop limit exceeded/;
  // replace chunk loading errors with a notification that the app has been updated
  const chunkLoadingErrRe = /^Uncaught SyntaxError: Unexpected token/;

  window.onerror = (errorMsg) => {
    if (
      typeof errorMsg === 'string' &&
      resizeObserverLoopErrRe.test(errorMsg)
    ) {
      return false;
    }

    if (typeof errorMsg === 'string' && chunkLoadingErrRe.test(errorMsg)) {
      alertModalWithText(
        APPLICATION_UPDATE_MESSAGE,
        APPLICATION_UPDATE_ACTION
      )();
      return false;
    }

    notifyError(`${errorMsg}`);
    return false;
  };
};

const initializeMixpanel = () => {
  // initialize mixpanel, before adding an alias or tracking identity
  try {
    if (
      document.location.host.startsWith('localhost') ||
      document.location.host.startsWith('127.0.0.1')
    ) {
      mixpanel.init(MIXPANEL_DEV_TOKEN, { debug: true });
    } else {
      // Production Mixpanel Project
      mixpanel.init(MIXPANEL_PROD_TOKEN, { debug: true });
    }
  } catch (e) {
    console.error('Mixpanel initialization error');
  }
};

// On login: called to initialize the logged-in state, available chains, and other metadata at /api/status
// On logout: called to reset everything
export async function initAppState(
  updateSelectedChain = true,
  customDomain = null
): Promise<void> {
  return new Promise((resolve, reject) => {
    $.get(`${app.serverUrl()}/status`)
      .then(async (data) => {
        app.config.chains.clear();
        app.config.nodes.clear();
        app.user.notifications.clear();
        app.user.notifications.clearSubscriptions();
        data.result.nodes
          .sort((a, b) => a.id - b.id)
          .map((node) => {
            return app.config.nodes.add(NodeInfo.fromJSON(node));
          });
        data.result.chainsWithSnapshots
          .filter((chainsWithSnapshots) => chainsWithSnapshots.chain.active)
          .map((chainsWithSnapshots) => {
            delete chainsWithSnapshots.chain.ChainNode;
            return app.config.chains.add(
              ChainInfo.fromJSON({
                ChainNode: app.config.nodes.getById(
                  chainsWithSnapshots.chain.chain_node_id
                ),
                snapshot: chainsWithSnapshots.snapshot,
                ...chainsWithSnapshots.chain,
              })
            );
          });
        app.roles.setRoles(data.result.roles);
        app.config.notificationCategories =
          data.result.notificationCategories.map((json) =>
            NotificationCategory.fromJSON(json)
          );
        app.config.invites = data.result.invites;
        app.config.chainCategories = data.result.chainCategories;
        app.config.chainCategoryTypes = data.result.chainCategoryTypes;

        // add recentActivity
        const { recentThreads } = data.result;
        recentThreads.forEach(({ chain, count }) => {
          app.recentActivity.setCommunityThreadCounts(chain, count);
        });

        // update the login status
        updateActiveUser(data.result.user);
        app.loginState = data.result.user
          ? LoginState.LoggedIn
          : LoginState.LoggedOut;

        if (app.loginState === LoginState.LoggedIn) {
          console.log('Initializing socket connection with JTW:', app.user.jwt);
          // init the websocket connection and the chain-events namespace
          app.socket.init(app.user.jwt);
          app.user.notifications.refresh().then(() => m.redraw());
        } else if (
          app.loginState === LoginState.LoggedOut &&
          app.socket.isConnected
        ) {
          // TODO: create global deinit function
          app.socket.disconnect();
        }

        app.user.setStarredCommunities(
          data.result.user ? data.result.user.starredCommunities : []
        );
        // update the selectedChain, unless we explicitly want to avoid
        // changing the current state (e.g. when logging in through link_new_address_modal)
        if (
          updateSelectedChain &&
          data.result.user &&
          data.result.user.selectedChain
        ) {
          app.user.setSelectedChain(
            ChainInfo.fromJSON(data.result.user.selectedChain)
          );
        }

        if (customDomain) {
          app.setCustomDomain(customDomain);
        }

        resolve();
      })
      .catch((err: any) => {
        app.loadingError =
          err.responseJSON?.error || 'Error loading application state';
        reject(err);
      });
  });
}

export async function deinitChainOrCommunity() {
  app.isAdapterReady = false;
  if (app.chain) {
    app.chain.networkStatus = ApiStatus.Disconnected;
    app.chain.deinitServer();
    await app.chain.deinit();
    console.log('Finished deinitializing chain');
    app.chain = null;
  }
  app.user.setSelectedChain(null);
  app.user.setActiveAccounts([]);
  app.user.ephemerallySetActiveAccount(null);
  document.title = 'Commonwealth';
}

const handleInviteLinkRedirect = () => {
  const inviteMessage = m.route.param('invitemessage');

  if (!inviteMessage) {
    return;
  }

  const isAcceptInviteMessage =
    m.route.param('message') === 'Must be logged in to accept invites';

  if (inviteMessage === 'failure' && isAcceptInviteMessage) {
    notifyInfo('Log in to join a community with an invite link');

    app.modals.create({
      modal: NewLoginModal,
      data: {
        modalType: isWindowMediumSmallInclusive(window.innerWidth)
          ? 'fullScreen'
          : 'centered',
        breakpointFn: isWindowMediumSmallInclusive,
      },
    });
  } else if (inviteMessage === 'failure') {
    const message = m.route.param('message');
    notifyError(message);
  } else if (inviteMessage === 'success') {
    if (app.config.invites.length === 0) {
      return;
    }

    app.modals.create({ modal: ConfirmInviteModal });
  } else {
    notifyError('Unexpected error with invite link');
  }
};

const handleLoginRedirects = () => {
  if (
    m.route.param('loggedin') &&
    m.route.param('loggedin').toString() === 'true' &&
    m.route.param('path') &&
    !m.route.param('path').startsWith('/login')
  ) {
    // (we call toString() because m.route.param() returns booleans, even though the types don't reflect this)
    // handle param-based redirect after email login

    /* If we are creating a new account, then we alias to create a new mixpanel user
     else we identify to associate mixpanel events
    */
    if (m.route.param('new') && m.route.param('new').toString() === 'true') {
      console.log('creating account');
    }

    m.route.set(m.route.param('path'), {}, { replace: true });
  } else if (
    localStorage &&
    localStorage.getItem &&
    localStorage.getItem('githubPostAuthRedirect')
  ) {
    // handle localStorage-based redirect after Github login (callback must occur within 30 seconds)
    try {
      const postAuth = JSON.parse(
        localStorage.getItem('githubPostAuthRedirect')
      );
      if (postAuth.path && +new Date() - postAuth.timestamp < 30 * 1000) {
        m.route.set(postAuth.path, {}, { replace: true });
      }
      localStorage.removeItem('githubPostAuthRedirect');
    } catch (e) {
      console.log('Error restoring path from localStorage');
    }
  } else if (
    localStorage &&
    localStorage.getItem &&
    localStorage.getItem('discordPostAuthRedirect')
  ) {
    try {
      const postAuth = JSON.parse(
        localStorage.getItem('discordPostAuthRedirect')
      );
      if (postAuth.path && +new Date() - postAuth.timestamp < 30 * 1000) {
        m.route.set(postAuth.path, {}, { replace: true });
      }
      localStorage.removeItem('discordPostAuthRedirect');
    } catch (e) {
      console.log('Error restoring path from localStorage');
    }
  }
};

const showLoginNotification = () => {
  const loggedIn = m.route.param('loggedin');
  const loginError = m.route.param('loginerror');

  if (loggedIn) {
    notifySuccess('Logged in!');
  } else if (loginError) {
    notifyError('Could not log in');
    console.error(m.route.param('loginerror'));
  }
};

export async function handleUpdateEmailConfirmation() {
  if (m.route.param('confirmation')) {
    if (m.route.param('confirmation') === 'success') {
      notifySuccess('Email confirmed!');
    }
  }
}

// called by the user, when clicking on the chain/node switcher menu
// returns a boolean reflecting whether initialization of chain via the
// initChain fn ought to proceed or abort
export async function selectChain(
  chain?: ChainInfo,
  deferred = false
): Promise<boolean> {
  // Select the default node, if one wasn't provided
  if (!chain) {
    if (app.user.selectedChain) {
      chain = app.user.selectedChain;
    } else {
      chain = app.config.chains.getById(app.config.defaultChain);
    }
    if (!chain) {
      throw new Error('no chain available');
    }
  }

  // Check for valid chain selection, and that we need to switch
  if (app.chain && chain === app.chain.meta) {
    return;
  }

  // Shut down old chain if applicable
  await deinitChainOrCommunity();
  app.chainPreloading = true;
  document.title = `Commonwealth – ${chain.name}`;
  setTimeout(() => m.redraw()); // redraw to show API status indicator

  // Import top-level chain adapter lazily, to facilitate code split.
  let newChain;
  let initApi; // required for NEAR
  if (chain.base === ChainBase.Substrate) {
    const Substrate = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "substrate-main" */
        './controllers/chain/substrate/adapter'
      )
    ).default;
    newChain = new Substrate(chain, app);
  } else if (chain.base === ChainBase.CosmosSDK) {
    const Cosmos = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "cosmos-main" */
        './controllers/chain/cosmos/adapter'
      )
    ).default;
    newChain = new Cosmos(chain, app);
  } else if (chain.network === ChainNetwork.Ethereum) {
    const Ethereum = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "ethereum-main" */
        './controllers/chain/ethereum/tokenAdapter'
      )
    ).default;
    newChain = new Ethereum(chain, app);
  } else if (
    chain.network === ChainNetwork.NEAR ||
    chain.network === ChainNetwork.NEARTestnet
  ) {
    const Near = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "near-main" */
        './controllers/chain/near/adapter'
      )
    ).default;
    newChain = new Near(chain, app);
    initApi = true;
  } else if (chain.network === ChainNetwork.Sputnik) {
    const Sputnik = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "sputnik-main" */
        './controllers/chain/near/sputnik/adapter'
      )
    ).default;
    newChain = new Sputnik(chain, app);
    initApi = true;
  } else if (chain.network === ChainNetwork.Moloch) {
    const Moloch = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "moloch-main" */
        './controllers/chain/ethereum/moloch/adapter'
      )
    ).default;
    newChain = new Moloch(chain, app);
  } else if (chain.network === ChainNetwork.Compound) {
    const Compound = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "compound-main" */
        './controllers/chain/ethereum/compound/adapter'
      )
    ).default;
    newChain = new Compound(chain, app);
  } else if (chain.network === ChainNetwork.Aave) {
    const Aave = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "aave-main" */
        './controllers/chain/ethereum/aave/adapter'
      )
    ).default;
    newChain = new Aave(chain, app);
  } else if (
    chain.network === ChainNetwork.ERC20 ||
    chain.network === ChainNetwork.AxieInfinity
  ) {
    const ERC20 = (
      await import(
        //   /* webpackMode: "lazy" */
        //   /* webpackChunkName: "erc20-main" */
        './controllers/chain/ethereum/tokenAdapter'
      )
    ).default;
    newChain = new ERC20(chain, app);
  } else if (chain.network === ChainNetwork.ERC721) {
    const ERC721 = (
      await import(
        //   /* webpackMode: "lazy" */
        //   /* webpackChunkName: "erc721-main" */
        './controllers/chain/ethereum/NftAdapter'
      )
    ).default;
    newChain = new ERC721(chain, app);
  } else if (chain.network === ChainNetwork.SPL) {
    const SPL = (
      await import(
        //   /* webpackMode: "lazy" */
        //   /* webpackChunkName: "spl-main" */
        './controllers/chain/solana/tokenAdapter'
      )
    ).default;
    newChain = new SPL(chain, app);
  } else if (chain.base === ChainBase.Solana) {
    const Solana = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "solana-main" */
        './controllers/chain/solana/adapter'
      )
    ).default;
    newChain = new Solana(chain, app);
  } else if (
    chain.base === ChainBase.Ethereum &&
    chain.type === ChainType.Offchain
  ) {
    const Ethereum = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "ethereum-main" */
        './controllers/chain/ethereum/adapter'
      )
    ).default;
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
    app.chain = null;
    return false;
  } else {
    app.chain = newChain;
  }
  if (initApi) {
    await app.chain.initApi(); // required for loading NearAccounts
  }
  app.chainPreloading = false;
  app.chain.deferred = deferred;

  // Instantiate active addresses before chain fully loads
  await updateActiveAddresses(chain);

  // Update default on server if logged in
  if (app.isLoggedIn()) {
    await app.user.selectChain({
      chain: chain.id,
    });
  }

  // If the user was invited to a chain/community, we can now pop up a dialog for them to accept the invite
  handleInviteLinkRedirect();

  // Redraw with not-yet-loaded chain and return true to indicate
  // initialization has finalized.
  m.redraw();
  return true;
}

// Initializes a selected chain. Requires `app.chain` to be defined and valid
// and not already initialized.
export async function initChain(): Promise<void> {
  if (!app.chain || !app.chain.meta || app.chain.loaded) return;
  if (!app.chain.apiInitialized) {
    await app.chain.initApi();
  }
  app.chain.deferred = false;
  const chain = app.chain.meta;
  await app.chain.initData();

  // Emit chain as updated
  app.chainAdapterReady.emit('ready');
  app.isAdapterReady = true;
  console.log(`${chain.network.toUpperCase()} started.`);

  // Instantiate (again) to create chain-specific Account<> objects
  await updateActiveAddresses(chain);

  // Finish redraw to remove loading dialog
  m.redraw();
}

export async function initNewTokenChain(address: string) {
  const chain_network = app.chain.network;
  const response = await $.getJSON('/api/getTokenForum', {
    address,
    chain_network,
    autocreate: true,
  });
  if (response.status !== 'Success') {
    // TODO: better custom 404
    m.route.set('/404');
  }
  // TODO: check if this is valid
  const { chain, node } = response.result;
  const chainInfo = ChainInfo.fromJSON(chain);
  const nodeInfo = new NodeInfo(node);
  if (!app.config.chains.getById(chainInfo.id)) {
    app.config.chains.add(chainInfo);
    app.config.nodes.add(nodeInfo);
  }
  await selectChain(chainInfo);
}

const _onpopstate = window.onpopstate;
window.onpopstate = (...args) => {
  app._lastNavigatedBack = true;
  app._lastNavigatedFrom = m.route.get();
  if (_onpopstate) _onpopstate.apply(this, args);
};

// set up ontouchmove blocker
document.ontouchmove = (event) => {
  event.preventDefault();
};

// set up moment-twitter
moment.updateLocale('en', {
  relativeTime: {
    // NOTE: This makes relative date display impossible for all
    // future dates, e.g. when displaying how long until an offchain
    // poll closes.
    future: 'just now',
    past: '%s ago',
    s: (num, withoutSuffix) => (withoutSuffix ? 'now' : 'seconds'),
    m: '1 min',
    mm: '%d min',
    h: '1 hour',
    hh: '%d hours',
    d: '1 day',
    dd: '%d days',
    M: '1 month',
    MM: '%d months',
    y: '1 year',
    yy: '%d years',
  },
});

Promise.all([$.ready, $.get('/api/domain')]).then(
  async ([, { customDomain }]) => {
    handleWindowError();

    m.route(document.body, '/', getRoutes(customDomain));

    injectGoogleTagManagerScript();
    initializeMixpanel();
    handleLoginRedirects();
    showLoginNotification();

    // initialize the app
    initAppState(true, customDomain)
      .then(async () => {
        if (app.loginState === LoginState.LoggedIn) {
          // refresh notifications once
          // grab all discussion drafts
          app.user.discussionDrafts.refreshAll().then(() => m.redraw());
        }

        handleInviteLinkRedirect();
        // If the user updates their email
        handleUpdateEmailConfirmation();

        m.redraw();
      })
      .catch(() => {
        m.redraw();
      });
  }
);

// /////////////////////////////////////////////////////////
// For browserify-hmr
// See browserify-hmr module.hot API docs for hooks docs.
declare const module: any; // tslint:disable-line no-reserved-keywords
if (module.hot) {
  module.hot.accept();
}
// /////////////////////////////////////////////////////////
