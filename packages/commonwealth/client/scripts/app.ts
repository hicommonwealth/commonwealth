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
import { ChainInfo, NodeInfo, NotificationCategory, Contract } from 'models';

import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import { updateActiveAddresses, updateActiveUser } from 'controllers/app/login';

import { Layout } from 'views/layout';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import { NewLoginModal } from 'views/modals/login_modal';
import { alertModalWithText } from 'views/modals/alert_modal';
import { pathIsDiscussion } from './identifiers';
import { isWindowMediumSmallInclusive } from './views/components/component_kit/helpers';

// Prefetch commonly used pages
import(/* webpackPrefetch: true */ 'views/pages/landing');
import(/* webpackPrefetch: true */ 'views/pages/commonwealth');
import(/* webpackPrefetch: true */ 'views/pages/discussions/index');
import(/* webpackPrefetch: true */ 'views/pages/view_proposal');
import(/* webpackPrefetch: true */ 'views/pages/view_thread');

// eslint-disable-next-line max-len
const APPLICATION_UPDATE_MESSAGE =
  'A new version of the application has been released. Please save your work and refresh.';
const APPLICATION_UPDATE_ACTION = 'Okay';

const MIXPANEL_DEV_TOKEN = '312b6c5fadb9a88d98dc1fb38de5d900';
const MIXPANEL_PROD_TOKEN = '993ca6dd7df2ccdc2a5d2b116c0e18c5';

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
        data.nodes
          .sort((a, b) => a.id - b.id)
          .map((node) => {
            return app.config.nodes.add(NodeInfo.fromJSON(node));
          });
        data.chains
          .filter((chain) => chain.active)
          .map((chain) => {
            delete chain.ChainNode;
            return app.config.chains.add(
              ChainInfo.fromJSON({
                ChainNode: app.config.nodes.getById(chain.chain_node_id),
                ...chain,
              })
            );
          });
        app.roles.setRoles(data.roles);
        app.config.notificationCategories = data.notificationCategories.map(
          (json) => NotificationCategory.fromJSON(json)
        );
        app.config.invites = data.invites;
        app.config.chainCategories = data.chainCategories;
        app.config.chainCategoryTypes = data.chainCategoryTypes;

        // add recentActivity
        const { recentThreads } = data;
        recentThreads.forEach(({ chain, count }) => {
          app.recentActivity.setCommunityThreadCounts(chain, count);
        });

        // update the login status
        updateActiveUser(data.user);
        app.loginState = data.user ? LoginState.LoggedIn : LoginState.LoggedOut;

        if (app.loginState == LoginState.LoggedIn) {
          console.log('Initializing socket connection with JTW:', app.user.jwt);
          // init the websocket connection and the chain-events namespace
          app.socket.init(app.user.jwt);
          app.user.notifications.refresh().then(() => m.redraw());
        } else if (
          app.loginState == LoginState.LoggedOut &&
          app.socket.isConnected
        ) {
          // TODO: create global deinit function
          app.socket.disconnect();
        }

        app.user.setStarredCommunities(
          data.user ? data.user.starredCommunities : []
        );
        // update the selectedChain, unless we explicitly want to avoid
        // changing the current state (e.g. when logging in through link_new_address_modal)
        if (updateSelectedChain && data.user && data.user.selectedChain) {
          app.user.setSelectedChain(
            ChainInfo.fromJSON(data.user.selectedChain)
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

export async function handleInviteLinkRedirect() {
  const inviteMessage = m.route.param('invitemessage');
  if (inviteMessage) {
    if (
      inviteMessage === 'failure' &&
      m.route.param('message') === 'Must be logged in to accept invites'
    ) {
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
      if (app.config.invites.length === 0) return;
      app.modals.create({ modal: ConfirmInviteModal });
    } else {
      notifyError('Unexpected error with invite link');
    }
  }
}

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
  } else if (chain.network === ChainNetwork.Commonwealth) {
    const Commonwealth = (
      await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "commonwealth-main" */
        './controllers/chain/ethereum/commonwealth/adapter'
      )
    ).default;
    newChain = new Commonwealth(chain, app);
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

// set up route navigation
m.route.prefix = '';
const _updateRoute = m.route.set;
export const updateRoute = (...args) => {
  app._lastNavigatedBack = false;
  app._lastNavigatedFrom = m.route.get();
  if (args[0] !== m.route.get()) _updateRoute.apply(this, args);
};
m.route.set = (...args) => {
  // set app params that maintain global state for:
  // - whether the user last clicked the back button
  // - the last page the user was on
  app._lastNavigatedBack = false;
  app._lastNavigatedFrom = m.route.get();
  // update route
  if (args[0] !== m.route.get()) _updateRoute.apply(this, args);
  // reset scroll position
  const html = document.getElementsByTagName('html')[0];
  if (html) html.scrollTo(0, 0);
  const body = document.getElementsByTagName('body')[0];
  if (body) body.scrollTo(0, 0);
};
export const navigateToSubpage = (...args) => {
  // prepend community if we are not on a custom domain
  if (!app.isCustomDomain() && app.activeChainId()) {
    args[0] = `/${app.activeChainId()}${args[0]}`;
  }
  app.sidebarMenu = 'default';
  m.route.set.apply(this, args);
};

/* Uncomment for redraw instrumentation
const _redraw = m.redraw;
function redrawInstrumented(...args) {
  console.log('redraw!');
  _redraw.apply(this, args);
}
redrawInstrumented.sync = (...args) => {
  console.log('redraw sync!');
  _redraw.sync.apply(this, args);
};
m.redraw = redrawInstrumented;
*/

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
  async ([ready, { customDomain }]) => {
    // set window error handler
    // ignore ResizeObserver error: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
    const resizeObserverLoopErrRe = /^ResizeObserver loop limit exceeded/;
    // replace chunk loading errors with a notification that the app has been updated
    const chunkLoadingErrRe = /^Uncaught SyntaxError: Unexpected token/;
    window.onerror = (errorMsg, url, lineNumber, colNumber, error) => {
      if (
        typeof errorMsg === 'string' &&
        resizeObserverLoopErrRe.test(errorMsg)
      )
        return false;
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

    const redirectRoute = (path: string | Function) => ({
      render: (vnode) => {
        m.route.set(
          typeof path === 'string' ? path : path(vnode.attrs),
          {},
          { replace: true }
        );
        return m(Layout);
      },
    });

    interface RouteAttrs {
      scoped: string | boolean;
      hideSidebar?: boolean;
      deferChain?: boolean;
    }

    let hasCompletedSuccessfulPageLoad = false;
    const importRoute = (path: string, attrs: RouteAttrs) => ({
      onmatch: async () => {
        return import(
          /* webpackMode: "lazy" */
          /* webpackChunkName: "route-[request]" */
          `./${path}`
        )
          .then((p) => {
            hasCompletedSuccessfulPageLoad = true;
            return p.default;
          })
          .catch((err) => {
            // handle import() error
            console.error(err);
            if (err.name === 'ChunkLoadError') {
              alertModalWithText(
                APPLICATION_UPDATE_MESSAGE,
                APPLICATION_UPDATE_ACTION
              )();
            }
            // return to the last page, if it was on commonwealth
            // eslint-disable-next-line no-restricted-globals
            if (hasCompletedSuccessfulPageLoad) history.back();
          });
      },
      render: (vnode) => {
        const { scoped, hideSidebar } = attrs;
        const scope =
          typeof scoped === 'string'
            ? // string => scope is defined by route
              scoped
            : scoped
            ? // true => scope is derived from path
              vnode.attrs.scope?.toString() || customDomain
            : // false => scope is null
              null;

        // Special case to defer chain loading specifically for viewing an offchain thread. We need
        // a special case because Threads and on-chain proposals are all viewed through the
        // same "/:scope/proposal/:type/:id" route.
        let deferChain = attrs.deferChain;
        const isDiscussion =
          vnode.attrs.type === 'discussion' ||
          pathIsDiscussion(scope, window.location.pathname);
        if (path === 'views/pages/view_proposal/index' && isDiscussion) {
          deferChain = true;
        }
        if (app.chain?.meta.type === ChainType.Token) {
          deferChain = false;
        }
        return m(Layout, { scope, deferChain, hideSidebar }, [vnode]);
      },
    });

    const isCustomDomain = !!customDomain;
    const { activeAccount } = app.user;
    m.route(document.body, '/', {
      // Sitewide pages
      '/about': importRoute('views/pages/commonwealth', {
        scoped: false,
      }),
      '/terms': importRoute('views/pages/landing/terms', { scoped: false }),
      '/privacy': importRoute('views/pages/landing/privacy', { scoped: false }),
      '/components': importRoute('views/pages/components', {
        scoped: false,
        hideSidebar: true,
      }),
      '/createCommunity': importRoute('views/pages/create_community', {
        scoped: false,
      }),
      ...(isCustomDomain
        ? {
            //
            // Custom domain routes
            //
            '/': importRoute('views/pages/discussions_redirect', {
              scoped: true,
            }),
            '/web3login': redirectRoute(() => '/'),
            '/search': importRoute('views/pages/search', {
              scoped: false,
              deferChain: true,
            }),
            // Notifications
            '/notification-settings': importRoute(
              'views/pages/notification_settings',
              { scoped: true, deferChain: true }
            ),
            '/notifications': importRoute('views/pages/notifications_page', {
              scoped: true,
              deferChain: true,
            }),
            // CMN
            '/projects': importRoute('views/pages/commonwealth/projects', {
              scoped: true,
            }),
            '/backers': importRoute('views/pages/commonwealth/backers', {
              scoped: true,
            }),
            '/collectives': importRoute(
              'views/pages/commonwealth/collectives',
              { scoped: true }
            ),
            // NEAR
            '/finishNearLogin': importRoute('views/pages/finish_near_login', {
              scoped: true,
            }),
            '/finishaxielogin': importRoute('views/pages/finish_axie_login', {
              scoped: true,
            }),
            // Discussions
            '/home': redirectRoute((attrs) => `/${attrs.scope}/`),
            '/discussions': importRoute('views/pages/discussions', {
              scoped: true,
              deferChain: true,
            }),
            '/discussions/:topic': importRoute('views/pages/discussions', {
              scoped: true,
              deferChain: true,
            }),
            '/overview': importRoute('views/pages/overview', {
              scoped: true,
              deferChain: true,
            }),
            '/members': importRoute('views/pages/members', {
              scoped: true,
              deferChain: true,
            }),
            '/sputnik-daos': importRoute('views/pages/sputnikdaos', {
              scoped: true,
              deferChain: true,
            }),
            '/chat/:channel': importRoute('views/pages/chat', {
              scoped: true,
              deferChain: true,
            }),
            '/new/discussion': importRoute('views/pages/new_thread', {
              scoped: true,
              deferChain: true,
            }),
            // Profiles
            '/account/:address': importRoute('views/pages/profile', {
              scoped: true,
              deferChain: true,
            }),
            '/account': redirectRoute((a) =>
              activeAccount ? `/account/${activeAccount.address}` : '/'
            ),
            // Governance
            '/referenda': importRoute('views/pages/referenda', {
              scoped: true,
            }),
            '/proposals': importRoute('views/pages/proposals', {
              scoped: true,
            }),
            '/council': importRoute('views/pages/council', { scoped: true }),
            '/delegate': importRoute('views/pages/delegate', { scoped: true }),
            '/proposal/:type/:identifier': importRoute(
              'views/pages/view_proposal/index',
              { scoped: true }
            ),
            '/proposal/:identifier': importRoute(
              'views/pages/view_proposal/index',
              { scoped: true }
            ),
            '/discussion/:identifier': importRoute(
              'views/pages/view_thread/index',
              { scoped: true }
            ),
            '/new/proposal/:type': importRoute(
              'views/pages/new_proposal/index',
              { scoped: true }
            ),
            '/new/proposal': importRoute('views/pages/new_proposal/index', {
              scoped: true,
            }),
            // Treasury
            '/treasury': importRoute('views/pages/treasury', { scoped: true }),
            '/bounties': importRoute('views/pages/bounties', { scoped: true }),
            '/tips': importRoute('views/pages/tips', { scoped: true }),
            '/validators': importRoute('views/pages/validators', {
              scoped: true,
            }),
            // Settings
            '/login': importRoute('views/pages/login', {
              scoped: true,
              deferChain: true,
            }),
            // Admin
            '/admin': importRoute('views/pages/admin', { scoped: true }),
            '/manage': importRoute('views/pages/manage_community/index', {
              scoped: true,
            }),
            '/spec_settings': importRoute('views/pages/spec_settings', {
              scoped: true,
              deferChain: true,
            }),
            '/settings': importRoute('views/pages/settings', { scoped: true }),
            '/analytics': importRoute('views/pages/stats', {
              scoped: true,
              deferChain: true,
            }),

            '/snapshot/:snapshotId': importRoute(
              'views/pages/snapshot_proposals',
              { scoped: true, deferChain: true }
            ),
            '/multiple-snapshots': importRoute(
              'views/pages/view_multiple_snapshot_spaces',
              { scoped: true, deferChain: true }
            ),
            '/snapshot/:snapshotId/:identifier': importRoute(
              'views/pages/view_snapshot_proposal',
              { scoped: true, deferChain: true }
            ),
            '/new/snapshot/:snapshotId': importRoute(
              'views/pages/new_snapshot_proposal',
              { scoped: true, deferChain: true }
            ),

            // Redirects
            '/:scope/dashboard': redirectRoute(() => '/'),
            '/:scope/notifications': redirectRoute(() => '/notifications'),
            '/:scope/notification-settings': redirectRoute(
              () => '/notification-settings'
            ),
            '/:scope/overview': redirectRoute(() => '/overview'),
            '/:scope/projects': redirectRoute(() => '/projects'),
            '/:scope/backers': redirectRoute(() => '/backers'),
            '/:scope/collectives': redirectRoute(() => '/collectives'),
            '/:scope/finishNearLogin': redirectRoute(() => '/finishNearLogin'),
            '/:scope/finishaxielogin': redirectRoute(() => '/finishaxielogin'),
            '/:scope/home': redirectRoute(() => '/'),
            '/:scope/discussions': redirectRoute(() => '/discussions'),
            '/:scope': redirectRoute(() => '/'),
            '/:scope/discussions/:topic': redirectRoute(
              (attrs) => `/discussions/${attrs.topic}/`
            ),
            '/:scope/search': redirectRoute(() => '/search'),
            '/:scope/members': redirectRoute(() => '/members'),
            '/:scope/sputnik-daos': redirectRoute(() => '/sputnik-daos'),
            '/:scope/chat/:channel': redirectRoute(
              (attrs) => `/chat/${attrs.channel}`
            ),
            '/:scope/new/discussion': redirectRoute(() => '/new/discussion'),
            '/:scope/account/:address': redirectRoute(
              (attrs) => `/account/${attrs.address}/`
            ),
            '/:scope/account': redirectRoute(() =>
              activeAccount ? `/account/${activeAccount.address}` : '/'
            ),
            '/:scope/referenda': redirectRoute(() => '/referenda'),
            '/:scope/proposals': redirectRoute(() => '/proposals'),
            '/:scope/council': redirectRoute(() => '/council'),
            '/:scope/delegate': redirectRoute(() => '/delegate'),
            '/:scope/proposal/:type/:identifier': redirectRoute(
              (attrs) => `/proposal/${attrs.type}/${attrs.identifier}/`
            ),
            '/:scope/proposal/:identifier': redirectRoute(
              (attrs) => `/proposal/${attrs.identifier}/`
            ),
            '/:scope/discussion/:identifier': redirectRoute(
              (attrs) => `/discussion/${attrs.identifier}/`
            ),
            '/:scope/new/proposal/:type': redirectRoute(
              (attrs) => `/new/proposal/${attrs.type}/`
            ),
            '/:scope/new/proposal': redirectRoute(() => '/new/proposal'),
            '/:scope/treasury': redirectRoute(() => '/treasury'),
            '/:scope/bounties': redirectRoute(() => '/bounties'),
            '/:scope/tips': redirectRoute(() => '/tips'),
            '/:scope/validators': redirectRoute(() => '/validators'),
            '/:scope/login': redirectRoute(() => '/login'),
            '/:scope/settings': redirectRoute(() => '/settings'),
            '/:scope/admin': redirectRoute(() => '/admin'),
            '/:scope/manage': redirectRoute(() => '/manage'),
            '/:scope/spec_settings': redirectRoute(() => '/spec_settings'),
            '/:scope/analytics': redirectRoute(() => '/analytics'),
            '/:scope/snapshot-proposals/:snapshotId': redirectRoute(
              (attrs) => `/snapshot/${attrs.snapshotId}`
            ),
            '/:scope/snapshot-proposal/:snapshotId/:identifier': redirectRoute(
              (attrs) => `/snapshot/${attrs.snapshotId}/${attrs.identifier}`
            ),
            '/:scope/new/snapshot-proposal/:snapshotId': redirectRoute(
              (attrs) => `/new/snapshot/${attrs.snapshotId}`
            ),
            '/:scope/snapshot-proposals/:snapshotId/:identifier': redirectRoute(
              (attrs) => `/snapshot/${attrs.snapshotId}/${attrs.identifier}`
            ),
            '/:scope/new/snapshot-proposals/:snapshotId': redirectRoute(
              (attrs) => `/new/snapshot/${attrs.snapshotId}`
            ),
          }
        : {
            //
            // Global routes
            //
            '/': importRoute('views/pages/landing', {
              scoped: false,
              hideSidebar: false,
            }),
            '/communities': importRoute('views/pages/community_cards', {
              scoped: false,
              hideSidebar: false,
            }),
            '/search': importRoute('views/pages/search', {
              scoped: false,
              deferChain: true,
            }),
            '/whyCommonwealth': importRoute('views/pages/commonwealth', {
              scoped: false,
              hideSidebar: true,
            }),
            '/dashboard': importRoute('views/pages/user_dashboard', {
              scoped: false,
              deferChain: true,
            }),
            '/dashboard/:type': importRoute('views/pages/user_dashboard', {
              scoped: false,
              deferChain: true,
            }),
            '/web3login': importRoute('views/pages/web3login', {
              scoped: false,
              deferChain: true,
            }),
            // Scoped routes
            //

            // Notifications
            '/:scope/notifications': importRoute(
              'views/pages/notifications_page',
              { scoped: true, deferChain: true }
            ),
            '/notifications': redirectRoute(() => '/edgeware/notifications'),
            '/notification-settings': importRoute(
              'views/pages/notification_settings',
              { scoped: true, deferChain: true }
            ),
            // CMN
            '/:scope/projects': importRoute(
              'views/pages/commonwealth/projects',
              { scoped: true }
            ),
            '/:scope/backers': importRoute('views/pages/commonwealth/backers', {
              scoped: true,
            }),
            '/:scope/collectives': importRoute(
              'views/pages/commonwealth/collectives',
              { scoped: true }
            ),
            // NEAR
            '/:scope/finishNearLogin': importRoute(
              'views/pages/finish_near_login',
              { scoped: true }
            ),
            '/finishaxielogin': importRoute('views/pages/finish_axie_login', {
              scoped: false,
            }),
            // Settings
            '/settings': redirectRoute(() => '/edgeware/settings'),
            '/:scope/settings': importRoute('views/pages/settings', {
              scoped: true,
            }),

            // Discussions
            '/home': redirectRoute('/'), // legacy redirect, here for compatibility only
            '/discussions': redirectRoute('/'), // legacy redirect, here for compatibility only
            '/:scope/home': redirectRoute((attrs) => `/${attrs.scope}/`),
            '/:scope': importRoute('views/pages/discussions_redirect', {
              scoped: true,
            }),
            '/:scope/discussions': importRoute('views/pages/discussions', {
              scoped: true,
              deferChain: true,
            }),
            '/:scope/overview': importRoute('views/pages/overview', {
              scoped: true,
              deferChain: true,
            }),
            '/:scope/discussions/:topic': importRoute(
              'views/pages/discussions',
              { scoped: true, deferChain: true }
            ),
            '/:scope/search': importRoute('views/pages/search', {
              scoped: true,
              deferChain: true,
            }),
            '/:scope/members': importRoute('views/pages/members', {
              scoped: true,
              deferChain: true,
            }),
            '/:scope/sputnik-daos': importRoute('views/pages/sputnikdaos', {
              scoped: true,
              deferChain: true,
            }),
            '/:scope/chat/:channel': importRoute('views/pages/chat', {
              scoped: true,
              deferChain: true,
            }),
            '/:scope/new/discussion': importRoute('views/pages/new_thread', {
              scoped: true,
              deferChain: true,
            }),
            // Profiles
            '/:scope/account/:address': importRoute('views/pages/profile', {
              scoped: true,
              deferChain: true,
            }),
            '/:scope/account': redirectRoute((a) =>
              activeAccount
                ? `/${a.scope}/account/${activeAccount.address}`
                : `/${a.scope}/`
            ),
            // Governance
            '/:scope/referenda': importRoute('views/pages/referenda', {
              scoped: true,
            }),
            '/:scope/proposals': importRoute('views/pages/proposals', {
              scoped: true,
            }),
            '/:scope/council': importRoute('views/pages/council', {
              scoped: true,
            }),
            '/:scope/delegate': importRoute('views/pages/delegate', {
              scoped: true,
            }),
            '/:scope/proposal/:type/:identifier': importRoute(
              'views/pages/view_proposal/index',
              { scoped: true }
            ),
            '/:scope/proposal/:identifier': importRoute(
              'views/pages/view_proposal/index',
              { scoped: true }
            ),
            '/:scope/discussion/:identifier': importRoute(
              'views/pages/view_thread/index',
              { scoped: true }
            ),
            '/:scope/new/proposal/:type': importRoute(
              'views/pages/new_proposal/index',
              { scoped: true }
            ),
            '/:scope/new/proposal': importRoute(
              'views/pages/new_proposal/index',
              { scoped: true }
            ),

            // Treasury
            '/:scope/treasury': importRoute('views/pages/treasury', {
              scoped: true,
            }),
            '/:scope/bounties': importRoute('views/pages/bounties', {
              scoped: true,
            }),
            '/:scope/tips': importRoute('views/pages/tips', { scoped: true }),
            '/:scope/validators': importRoute('views/pages/validators', {
              scoped: true,
            }),
            // Settings
            '/login': importRoute('views/pages/login', { scoped: false }),
            '/:scope/login': importRoute('views/pages/login', {
              scoped: true,
              deferChain: true,
            }),
            // Admin
            '/:scope/admin': importRoute('views/pages/admin', { scoped: true }),
            '/manage': importRoute('views/pages/manage_community/index', {
              scoped: false,
            }),
            '/:scope/manage': importRoute(
              'views/pages/manage_community/index',
              { scoped: true }
            ),
            '/:scope/spec_settings': importRoute('views/pages/spec_settings', {
              scoped: true,
              deferChain: true,
            }),
            '/:scope/analytics': importRoute('views/pages/stats', {
              scoped: true,
              deferChain: true,
            }),

            '/:scope/snapshot/:snapshotId': importRoute(
              'views/pages/snapshot_proposals',
              { scoped: true, deferChain: true }
            ),
            '/:scope/multiple-snapshots': importRoute(
              'views/pages/view_multiple_snapshot_spaces',
              { scoped: true, deferChain: true }
            ),
            '/:scope/snapshot/:snapshotId/:identifier': importRoute(
              'views/pages/view_snapshot_proposal',
              { scoped: true, deferChain: true }
            ),
            '/:scope/new/snapshot/:snapshotId': importRoute(
              'views/pages/new_snapshot_proposal',
              { scoped: true, deferChain: true }
            ),
            '/:scope/snapshot-proposals/:snapshotId': redirectRoute(
              (attrs) => `/${attrs.scope}/snapshot/${attrs.snapshotId}`
            ),
            '/:scope/snapshot-proposal/:snapshotId/:identifier': redirectRoute(
              (attrs) =>
                `/${attrs.scope}/snapshot/${attrs.snapshotId}/${attrs.identifier}`
            ),
            '/:scope/new/snapshot-proposal/:snapshotId': redirectRoute(
              (attrs) => `/${attrs.scope}/new/snapshot/${attrs.snapshotId}`
            ),
            '/:scope/snapshot-proposals/:snapshotId/:identifier': redirectRoute(
              (attrs) =>
                `/${attrs.scope}/snapshot/${attrs.snapshotId}/${attrs.identifier}`
            ),
            '/:scope/new/snapshot-proposals/:snapshotId': redirectRoute(
              (attrs) => `/${attrs.scope}/new/snapshot/${attrs.snapshotId}`
            ),
          }),
    });

    const script = document.createElement('noscript');
    // eslint-disable-next-line max-len
    m.render(
      script,
      m.trust(
        '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KRWH69V" height="0" width="0" style="display:none;visibility:hidden"></iframe>'
      )
    );
    document.body.insertBefore(script, document.body.firstChild);

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

    // handle login redirects
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

        try {
        } catch (err) {
          // Don't do anything... Just identify if there is an error
          // mixpanel.identify(m.route.param('email').toString());
        }
      } else {
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
    if (m.route.param('loggedin')) {
      notifySuccess('Logged in!');
    } else if (m.route.param('loginerror')) {
      notifyError('Could not log in');
      console.error(m.route.param('loginerror'));
    }

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
  // module.hot.dispose((data: any) => {
  //   m.redraw();
  // })
}
// /////////////////////////////////////////////////////////
