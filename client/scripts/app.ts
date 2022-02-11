/* eslint-disable @typescript-eslint/ban-types */
import 'lib/normalize.css';
import 'lib/flexboxgrid.css';
import 'lity/dist/lity.min.css';
import 'construct.scss';
// import 'tailwindcss/tailwind.css';
import '../styles/style.css';
import '../styles/lib/style.css';
import 'simplepicker/dist/simplepicker.css';

import m from 'mithril';
import $ from 'jquery';
import { FocusManager } from 'construct-ui';
import moment from 'moment';
import mixpanel from 'mixpanel-browser';

import app, { ApiStatus, LoginState } from 'state';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { ChainInfo,  NodeInfo, NotificationCategory, } from 'models';

import { WebSocketController } from 'controllers/server/socket';

import { notifyError, notifyInfo, notifySuccess } from 'controllers/app/notifications';
import { updateActiveAddresses, updateActiveUser } from 'controllers/app/login';

import { Layout } from 'views/layout';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import LoginModal from 'views/modals/login_modal';
import { alertModalWithText } from 'views/modals/alert_modal';
import { pathIsDiscussion } from './identifiers';

// Prefetch commonly used pages
import(/* webpackPrefetch: true */ 'views/pages/landing');
import(/* webpackPrefetch: true */ 'views/pages/commonwealth');
import(/* webpackPrefetch: true */ 'views/pages/discussions');
import(/* webpackPrefetch: true */ 'views/pages/view_proposal');

// eslint-disable-next-line max-len
const APPLICATION_UPDATE_MESSAGE = 'A new version of the application has been released. Please save your work and refresh.';
const APPLICATION_UPDATE_ACTION = 'Okay';

// On login: called to initialize the logged-in state, available chains, and other metadata at /api/status
// On logout: called to reset everything
export async function initAppState(updateSelectedNode = true, customDomain = null): Promise<void> {

  return new Promise((resolve, reject) => {
    $.get(`${app.serverUrl()}/status`).then( async (data) => {
      app.config.chains.clear();
      app.config.nodes.clear();
      app.user.notifications.store.clear();
      app.user.notifications.clearSubscriptions();
      data.chains.filter((chain) => chain.active)
        .map((chain) => app.config.chains.add(ChainInfo.fromJSON(chain)));
      data.nodes.sort((a, b) => a.id - b.id).map((node) => {
        return app.config.nodes.add(NodeInfo.fromJSON({
          id: node.id,
          url: node.url,
          chain: app.config.chains.getById(node.chain),
          address: node.address,
          token_name: node.token_name,
          eth_chain_id: node.eth_chain_id,
          alt_wallet_url: node.alt_wallet_url,
        }));
      });
      app.user.setRoles(data.roles);
      app.config.notificationCategories = data.notificationCategories
        .map((json) => NotificationCategory.fromJSON(json));
      app.config.invites = data.invites;

      // add recentActivity
      const { recentThreads } = data;
      Object.entries(recentThreads).forEach(([comm, count]) => {
        app.recentActivity.setCommunityThreadCounts(comm, count);
      });

      // update the login status
      updateActiveUser(data.user);
      app.loginState = data.user ? LoginState.LoggedIn : LoginState.LoggedOut;

      if (!app.socket && app.loginState === LoginState.LoggedIn) {
        app.socket = new WebSocketController(app.user.jwt);
        app.user.notifications.refresh().then(() => m.redraw());
      } else if (app.socket && app.loginState === LoginState.LoggedOut) {
        app.socket.disconnect();
        app.socket = undefined;
      }

      app.user.setStarredCommunities(data.user ? data.user.starredCommunities : []);

      // update the selectedNode, unless we explicitly want to avoid
      // changing the current state (e.g. when logging in through link_new_address_modal)
      if (updateSelectedNode && data.user && data.user.selectedNode) {
        app.user.setSelectedNode(NodeInfo.fromJSON(data.user.selectedNode));
      }

      if (customDomain) {
        app.setCustomDomain(customDomain);
      }

      resolve();
    }).catch((err: any) => {
      app.loadingError = err.responseJSON?.error || 'Error loading application state';
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
  app.user.setSelectedNode(null);
  app.user.setActiveAccounts([]);
  app.user.ephemerallySetActiveAccount(null);
  document.title = 'Commonwealth';
}

export async function handleInviteLinkRedirect() {
  const inviteMessage = m.route.param('invitemessage');
  if (inviteMessage) {
    mixpanel.track('Invite Link Used', {
      'Step No': 1,
      'Step': inviteMessage,
    });
    if (inviteMessage === 'failure' && m.route.param('message') === 'Must be logged in to accept invites') {
      notifyInfo('Log in to join a community with an invite link');
      app.modals.create({ modal: LoginModal });
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
    mixpanel.track('Update Email Verification Redirect', {
      'Step No': 1,
      'Step': m.route.param('confirmation'),
    });
    if (m.route.param('confirmation') === 'success') {
      notifySuccess('Email confirmed!');
    }
  }
}

// called by the user, when clicking on the chain/node switcher menu
// returns a boolean reflecting whether initialization of chain via the
// initChain fn ought to proceed or abort
export async function selectNode(n?: NodeInfo, deferred = false): Promise<boolean> {
  // Select the default node, if one wasn't provided
  if (!n) {
    if (app.user.selectedNode) {
      n = app.user.selectedNode;
    } else {
      n = app.config.nodes.getByChain(app.config.defaultChain)[0];
    }
    if (!n) {
      throw new Error('no nodes available');
    }
  }

  // Check for valid chain selection, and that we need to switch
  if (app.chain && n === app.chain.meta) {
    return;
  }

  // Shut down old chain if applicable
  await deinitChainOrCommunity();
  app.chainPreloading = true;
  document.title = `Commonwealth – ${n.chain.name}`;
  setTimeout(() => m.redraw()); // redraw to show API status indicator

  // Import top-level chain adapter lazily, to facilitate code split.
  let newChain;
  let initApi; // required for NEAR
  if (n.chain.base === ChainBase.Substrate) {
    const Substrate = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "substrate-main" */
      './controllers/chain/substrate/main'
    )).default;
    newChain = new Substrate(n, app);
  } else if (n.chain.base === ChainBase.CosmosSDK) {
    const Cosmos = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "cosmos-main" */
      './controllers/chain/cosmos/main'
    )).default;
    newChain = new Cosmos(n, app);
  } else if (n.chain.network === ChainNetwork.Ethereum) {
    const Ethereum = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "ethereum-main" */
      './controllers/chain/ethereum/main'
    )).default;
    newChain = new Ethereum(n, app);
  } else if (n.chain.network === ChainNetwork.NEAR || n.chain.network === ChainNetwork.NEARTestnet) {
    const Near = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "near-main" */
      './controllers/chain/near/main'
    )).default;
    newChain = new Near(n, app);
    initApi = true;
  } else if (n.chain.network === ChainNetwork.Sputnik) {
    const Sputnik = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "sputnik-main" */
      './controllers/chain/near/sputnik/adapter'
    )).default;
    newChain = new Sputnik(n, app);
    initApi = true;
  } else if (n.chain.network === ChainNetwork.Moloch) {
    const Moloch = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "moloch-main" */
      './controllers/chain/ethereum/moloch/adapter'
    )).default;
    newChain = new Moloch(n, app);
  } else if (n.chain.network === ChainNetwork.Compound) {
    const Compound = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "compound-main" */
      './controllers/chain/ethereum/compound/adapter'
    )).default;
    newChain = new Compound(n, app);
  } else if (n.chain.network === ChainNetwork.Aave) {
    const Aave = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "aave-main" */
      './controllers/chain/ethereum/aave/adapter'
    )).default;
    newChain = new Aave(n, app);
  } else if (n.chain.network === ChainNetwork.ERC20) {
    const ERC20 = (await import(
    //   /* webpackMode: "lazy" */
    //   /* webpackChunkName: "erc20-main" */
      './controllers/chain/ethereum/tokenAdapter'
    )).default;
    newChain = new ERC20(n, app);
  } else if (n.chain.network === ChainNetwork.SPL) {
    const SPL = (await import(
      //   /* webpackMode: "lazy" */
      //   /* webpackChunkName: "spl-main" */
      './controllers/chain/solana/tokenAdapter'
    )).default;
    newChain = new SPL(n, app);
  } else if (n.chain.base === ChainBase.Solana) {
    const Solana = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "solana-main" */
      './controllers/chain/solana/main'
    )).default;
    newChain = new Solana(n, app);
  } else if (n.chain.network === ChainNetwork.Commonwealth) {
    const Commonwealth = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "commonwealth-main" */
      './controllers/chain/ethereum/commonwealth/adapter'
    )).default;
    newChain = new Commonwealth(n, app);
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
  await updateActiveAddresses(n.chain);

  // Update default on server if logged in
  if (app.isLoggedIn()) {
    await app.user.selectNode({
      url: n.url,
      chain: n.chain.id
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
  const n = app.chain.meta;
  await app.chain.initData();

  // Emit chain as updated
  app.chainAdapterReady.emit('ready');
  app.isAdapterReady = true;
  console.log(`${n.chain.network.toUpperCase()} started.`);

  // Instantiate (again) to create chain-specific Account<> objects
  await updateActiveAddresses(n.chain);

  // Finish redraw to remove loading dialog
  m.redraw();
}

export async function initNewTokenChain(address: string) {
  const response = await $.getJSON('/api/getTokenForum', { address, autocreate: true });
  if (response.status !== 'Success') {
    // TODO: better custom 404
    m.route.set('/404');
  }
  const { chain, node } = response.result;
  const chainInfo = ChainInfo.fromJSON(chain);
  const nodeInfo = new NodeInfo(node);
  if (!app.config.chains.getById(chainInfo.id)) {
    app.config.chains.add(chainInfo);
    app.config.nodes.add(nodeInfo);
  }
  await selectNode(nodeInfo);
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
  if (!app.isCustomDomain()) {
    args[0] = `/${app.activeChainId()}${args[0]}`;
  }
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
    future : 'just now',
    past   : '%s ago',
    s  : (num, withoutSuffix) => withoutSuffix ? 'now' : 'seconds',
    m  : '1 min',
    mm : '%d min',
    h  : '1 hour',
    hh : '%d hours',
    d  : '1 day',
    dd : '%d days',
    M  : '1 month',
    MM : '%d months',
    y  : '1 year',
    yy : '%d years'
  }
});

Promise.all([
  $.ready,
  $.get('/api/domain'),
]).then(async ([ ready, { customDomain } ]) => {
  // set window error handler
  // ignore ResizeObserver error: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
  const resizeObserverLoopErrRe = /^ResizeObserver loop limit exceeded/;
  // replace chunk loading errors with a notification that the app has been updated
  const chunkLoadingErrRe = /^Uncaught SyntaxError: Unexpected token/;
  window.onerror = (errorMsg, url, lineNumber, colNumber, error) => {
    if (typeof errorMsg === 'string' && resizeObserverLoopErrRe.test(errorMsg)) return false;
    if (typeof errorMsg === 'string' && chunkLoadingErrRe.test(errorMsg)) {
      alertModalWithText(APPLICATION_UPDATE_MESSAGE, APPLICATION_UPDATE_ACTION)();
      return false;
    }
    notifyError(`${errorMsg}`);
    return false;
  };

  const redirectRoute = (path: string | Function) => ({
    render: (vnode) => {
      m.route.set((typeof path === 'string' ? path : path(vnode.attrs)), {}, { replace: true });
      return m(Layout);
    }
  });

  interface RouteAttrs {
    scoped: string | boolean;
    hideSidebar?: boolean;
    deferChain?: boolean;
  }

  let hasCompletedSuccessfulPageLoad = false;
  const importRoute = (path: string, attrs: RouteAttrs) => ({
    onmatch:  async () => {
      return import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "route-[request]" */
        `./${path}`
      ).then((p) => {
        hasCompletedSuccessfulPageLoad = true;
        return p.default;
      }).catch((err) => {
        // handle import() error
        console.error(err);
        if (err.name === 'ChunkLoadError') {
          alertModalWithText(APPLICATION_UPDATE_MESSAGE, APPLICATION_UPDATE_ACTION)();
        }
        // return to the last page, if it was on commonwealth
        // eslint-disable-next-line no-restricted-globals
        if (hasCompletedSuccessfulPageLoad) history.back();
      });
    },
    render:  (vnode) => {
      const { scoped, hideSidebar } = attrs;
      const scope = typeof scoped === 'string'
        // string => scope is defined by route
        ? scoped
        : scoped
          // true => scope is derived from path
          ? (vnode.attrs.scope?.toString() || customDomain)
          // false => scope is null
          : null;

      if (scope) {
        const scopeIsEthereumAddress = scope.startsWith('0x') && scope.length === 42;
        if (scopeIsEthereumAddress) {
          const nodes = app.config.nodes.getAll();
          const node = nodes.find((o) => o.address === scope);
          if (node) {
            const pagePath = window.location.href.substr(window.location.href.indexOf(scope) + scope.length);
            m.route.set(`/${node.chain.id}${pagePath}`);
          }
        }
      }

      // Special case to defer chain loading specifically for viewing an offchain thread. We need
      // a special case because OffchainThreads and on-chain proposals are all viewed through the
      // same "/:scope/proposal/:type/:id" route.
      let deferChain = attrs.deferChain;
      const isDiscussion = vnode.attrs.type === 'discussion' || pathIsDiscussion(scope, window.location.pathname);
      if (path === 'views/pages/view_proposal/index' && isDiscussion) {
        deferChain = true;
      }
      if (app.chain?.meta.chain.type === ChainType.Token) {
        deferChain = false;
      }
      return m(Layout, { scope, deferChain, hideSidebar }, [ vnode ]);
    },
  });

  const isCustomDomain = !!customDomain;
  const activeAcct = app.user.activeAccount;
  m.route(document.body, '/', {
    // Sitewide pages
    '/about':                    importRoute('views/pages/landing/about', { scoped: false }),
    '/terms':                    importRoute('views/pages/landing/terms', { scoped: false }),
    '/privacy':                  importRoute('views/pages/landing/privacy', { scoped: false }),
    '/components':               importRoute('views/pages/components', { scoped: false, hideSidebar: true }),
    '/createCommunity':         importRoute('views/pages/create_community', { scoped: false }),
    ...(isCustomDomain ? {
      //
      // Custom domain routes
      //
      '/':                       importRoute('views/pages/discussions', { scoped: true, deferChain: true }),
      '/search':                 importRoute('views/pages/search', { scoped: false, deferChain: true }),
      // Notifications
      '/notification-settings':  importRoute('views/pages/notification_settings', { scoped: true, deferChain: true }),
      '/notifications':          importRoute('views/pages/notifications_page', { scoped: true, deferChain: true }),
      // CMN
      '/projects':               importRoute('views/pages/commonwealth/projects', { scoped: true }),
      '/backers':                importRoute('views/pages/commonwealth/backers', { scoped: true }),
      '/collectives':            importRoute('views/pages/commonwealth/collectives', { scoped: true }),
      // NEAR
      '/finishNearLogin':        importRoute('views/pages/finish_near_login', { scoped: true }),
      // Discussions
      '/home':                   redirectRoute((attrs) => `/${attrs.scope}/`),
      '/discussions':            redirectRoute((attrs) => `/${attrs.scope}/`),
      '/discussions/:topic':     importRoute('views/pages/discussions', { scoped: true, deferChain: true }),
      '/members':                importRoute('views/pages/members', { scoped: true, deferChain: true }),
      '/sputnik-daos':           importRoute('views/pages/sputnikdaos', { scoped: true, deferChain: true }),
      '/chat':                   importRoute('views/pages/chat', { scoped: true, deferChain: true }),
      '/new/discussion':             importRoute('views/pages/new_thread', { scoped: true, deferChain: true }),
      // Profiles
      '/account/:address':       importRoute('views/pages/profile', { scoped: true, deferChain: true }),
      '/account':                redirectRoute((a) => activeAcct ? `/account/${activeAcct.address}` : '/'),
      // Governance
      '/referenda':              importRoute('views/pages/referenda', { scoped: true }),
      '/proposals':              importRoute('views/pages/proposals', { scoped: true }),
      '/council':                importRoute('views/pages/council', { scoped: true }),
      '/delegate':               importRoute('views/pages/delegate', { scoped: true, }),
      '/proposal/:type/:identifier': importRoute('views/pages/view_proposal/index', { scoped: true }),
      '/proposal/:identifier': importRoute('views/pages/view_proposal/index', { scoped: true }),
      '/discussion/:identifier': importRoute('views/pages/view_proposal/index', { scoped: true }),
      '/new/proposal/:type':     importRoute('views/pages/new_proposal/index', { scoped: true }),
      '/new/proposal':           importRoute('views/pages/new_proposal/index', { scoped: true }),
      // Treasury
      '/treasury':               importRoute('views/pages/treasury', { scoped: true }),
      '/bounties':               importRoute('views/pages/bounties', { scoped: true }),
      '/tips':                   importRoute('views/pages/tips', { scoped: true }),
      '/validators':             importRoute('views/pages/validators', { scoped: true }),
      // Settings
      '/login':                  importRoute('views/pages/login', { scoped: true, deferChain: true }),
      '/web3login':              importRoute('views/pages/web3login', { scoped: true }),
      // Admin
      '/admin':                  importRoute('views/pages/admin', { scoped: true }),
      '/manage':                 importRoute('views/pages/manage_community/index', { scoped: true }),
      '/spec_settings':          importRoute('views/pages/spec_settings', { scoped: true, deferChain: true }),
      '/settings':               importRoute('views/pages/settings', { scoped: true }),
      '/analytics':              importRoute('views/pages/stats', { scoped: true, deferChain: true }),

      '/snapshot/:snapshotId': importRoute(
        'views/pages/snapshot_proposals', { scoped: true, deferChain: true }
      ),
      '/multiple-snapshots': importRoute(
        'views/pages/view_multiple_snapshot_spaces', { scoped: true, deferChain: true }
      ),
      '/snapshot/:snapshotId/:identifier': importRoute(
        'views/pages/view_snapshot_proposal', { scoped: true }
      ),
      '/new/snapshot/:snapshotId': importRoute(
        'views/pages/new_snapshot_proposal', { scoped: true, deferChain: true }
      ),

      // Redirects
      '/:scope/notifications':      redirectRoute(() => '/notifications'),
      '/:scope/notification-settings':  redirectRoute(() => '/notification-settings'),
      '/:scope/projects':           redirectRoute(() => '/projects'),
      '/:scope/backers':            redirectRoute(() => '/backers'),
      '/:scope/collectives':        redirectRoute(() => '/collectives'),
      '/:scope/finishNearLogin':    redirectRoute(() => '/finishNearLogin'),
      '/:scope/home':               redirectRoute(() => '/'),
      '/:scope/discussions':        redirectRoute(() => '/'),
      '/:scope':                    redirectRoute(() => '/'),
      '/:scope/discussions/:topic': redirectRoute((attrs) => `/discussions/${attrs.topic}/`),
      '/:scope/search':             redirectRoute(() => '/search'),
      '/:scope/members':            redirectRoute(() => '/members'),
      '/:scope/sputnik-daos':       redirectRoute(() => '/sputnik-daos'),
      '/:scope/chat':               redirectRoute(() => '/chat'),
      '/:scope/new/discussion':         redirectRoute(() => '/new/discussion'),
      '/:scope/account/:address':   redirectRoute((attrs) => `/account/${attrs.address}/`),
      '/:scope/account':            redirectRoute(() => activeAcct ? `/account/${activeAcct.address}` : '/'),
      '/:scope/referenda':          redirectRoute(() => '/referenda'),
      '/:scope/proposals':          redirectRoute(() => '/proposals'),
      '/:scope/council':            redirectRoute(() => '/council'),
      '/:scope/delegate':           redirectRoute(() => '/delegate'),
      '/:scope/proposal/:type/:identifier': redirectRoute((attrs) => `/proposal/${attrs.type}/${attrs.identifier}/`),
      '/:scope/proposal/:identifier': redirectRoute((attrs) => `/proposal/${attrs.identifier}/`),
      '/:scope/discussion/:identifier': redirectRoute((attrs) => `/discussion/${attrs.identifier}/`),
      '/:scope/new/proposal/:type':  redirectRoute((attrs) => `/new/proposal/${attrs.type}/`),
      '/:scope/new/proposal':        redirectRoute(() => '/new/proposal'),
      '/:scope/treasury':           redirectRoute(() => '/treasury'),
      '/:scope/bounties':           redirectRoute(() => '/bounties'),
      '/:scope/tips':               redirectRoute(() => '/tips'),
      '/:scope/validators':         redirectRoute(() => '/validators'),
      '/:scope/login':              redirectRoute(() => '/login'),
      '/:scope/web3login':          redirectRoute(() => '/web3login'),
      '/:scope/settings':           redirectRoute(() => '/settings'),
      '/:scope/admin':              redirectRoute(() => '/admin'),
      '/:scope/manage':             redirectRoute(() => '/manage'),
      '/:scope/spec_settings':      redirectRoute(() => '/spec_settings'),
      '/:scope/analytics':          redirectRoute(() => '/analytics'),
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
    } : {
      //
      // Scoped routes
      //
      '/':                         importRoute('views/pages/landing', { scoped: false, hideSidebar: false }),
      '/communities':              importRoute('views/pages/community_cards', { scoped: false, hideSidebar: false }),
      '/search':                   importRoute('views/pages/search', { scoped: false, deferChain: true }),
      '/whyCommonwealth':          importRoute('views/pages/commonwealth', { scoped: false, hideSidebar: true }),
      // Notifications
      '/:scope/notifications':     importRoute('views/pages/notifications_page', { scoped: true, deferChain: true }),
      '/notifications':            redirectRoute(() => '/edgeware/notifications'),
      '/:scope/notification-settings': importRoute('views/pages/notification_settings', { scoped: true, deferChain: true }),
      '/notification-settings':    redirectRoute(() => '/edgeware/notification-settings'),
      // CMN
      '/:scope/projects':          importRoute('views/pages/commonwealth/projects', { scoped: true }),
      '/:scope/backers':           importRoute('views/pages/commonwealth/backers', { scoped: true }),
      '/:scope/collectives':       importRoute('views/pages/commonwealth/collectives', { scoped: true }),
      // NEAR
      '/:scope/finishNearLogin':   importRoute('views/pages/finish_near_login', { scoped: true }),
      // Settings
      '/settings':                 redirectRoute(() => '/edgeware/settings'),
      '/:scope/settings':          importRoute('views/pages/settings', { scoped: true }),

      // Discussions
      '/home':                     redirectRoute('/'), // legacy redirect, here for compatibility only
      '/discussions':              redirectRoute('/'), // legacy redirect, here for compatibility only
      '/:scope/home':              redirectRoute((attrs) => `/${attrs.scope}/`),
      '/:scope/discussions':       redirectRoute((attrs) => `/${attrs.scope}/`),
      '/:scope':                   importRoute('views/pages/discussions', { scoped: true, deferChain: true }),
      '/:scope/discussions/:topic': importRoute('views/pages/discussions', { scoped: true, deferChain: true }),
      '/:scope/search':            importRoute('views/pages/search', { scoped: true, deferChain: true }),
      '/:scope/members':           importRoute('views/pages/members', { scoped: true, deferChain: true }),
      '/:scope/sputnik-daos':      importRoute('views/pages/sputnikdaos', { scoped: true, deferChain: true }),
      '/:scope/chat':              importRoute('views/pages/chat', { scoped: true, deferChain: true }),
      '/:scope/new/discussion':        importRoute('views/pages/new_thread', { scoped: true, deferChain: true }),
      // Profiles
      '/:scope/account/:address':  importRoute('views/pages/profile', { scoped: true, deferChain: true }),
      '/:scope/account':           redirectRoute(
        (a) => activeAcct ? `/${a.scope}/account/${activeAcct.address}` : `/${a.scope}/`
      ),
      // Governance
      '/:scope/referenda':         importRoute('views/pages/referenda', { scoped: true }),
      '/:scope/proposals':         importRoute('views/pages/proposals', { scoped: true }),
      '/:scope/council':           importRoute('views/pages/council', { scoped: true }),
      '/:scope/delegate':          importRoute('views/pages/delegate', { scoped: true, }),
      '/:scope/proposal/:type/:identifier': importRoute('views/pages/view_proposal/index', { scoped: true }),
      '/:scope/proposal/:identifier':   importRoute('views/pages/view_proposal/index', { scoped: true }),
      '/:scope/discussion/:identifier': importRoute('views/pages/view_proposal/index', { scoped: true }),
      '/:scope/new/proposal/:type':     importRoute('views/pages/new_proposal/index', { scoped: true }),
      '/:scope/new/proposal':           importRoute('views/pages/new_proposal/index', { scoped: true }),

      // Treasury
      '/:scope/treasury':          importRoute('views/pages/treasury', { scoped: true }),
      '/:scope/bounties':          importRoute('views/pages/bounties', { scoped: true }),
      '/:scope/tips':              importRoute('views/pages/tips', { scoped: true }),
      '/:scope/validators':        importRoute('views/pages/validators', { scoped: true }),
      // Settings
      '/login':                    importRoute('views/pages/login', { scoped: false }),
      '/:scope/login':             importRoute('views/pages/login', { scoped: true, deferChain: true }),
      '/:scope/web3login':         importRoute('views/pages/web3login', { scoped: true }),
      // Admin
      '/:scope/admin':             importRoute('views/pages/admin', { scoped: true }),
      '/manage':                 importRoute('views/pages/manage_community/index', { scoped: false }),
      '/:scope/manage':          importRoute('views/pages/manage_community/index', { scoped: true }),
      '/:scope/spec_settings':     importRoute('views/pages/spec_settings', { scoped: true, deferChain: true }),
      '/:scope/analytics':         importRoute('views/pages/stats', { scoped: true, deferChain: true }),

      '/:scope/snapshot/:snapshotId': importRoute(
        'views/pages/snapshot_proposals', { scoped: true, deferChain: true }
      ),
      '/:scope/multiple-snapshots': importRoute(
        'views/pages/view_multiple_snapshot_spaces', { scoped: true, deferChain: true }
      ),
      '/:scope/snapshot/:snapshotId/:identifier': importRoute(
        'views/pages/view_snapshot_proposal', { scoped: true }
      ),
      '/:scope/new/snapshot/:snapshotId': importRoute(
        'views/pages/new_snapshot_proposal', { scoped: true, deferChain: true }
      ),
      '/:scope/snapshot-proposals/:snapshotId': redirectRoute(
        (attrs) => `/${attrs.scope}/snapshot/${attrs.snapshotId}`
      ),
      '/:scope/snapshot-proposal/:snapshotId/:identifier': redirectRoute(
        (attrs) => `/${attrs.scope}/snapshot/${attrs.snapshotId}/${attrs.identifier}`
      ),
      '/:scope/new/snapshot-proposal/:snapshotId': redirectRoute(
        (attrs) => `/${attrs.scope}/new/snapshot/${attrs.snapshotId}`
      ),
      '/:scope/snapshot-proposals/:snapshotId/:identifier': redirectRoute(
        (attrs) => `/${attrs.scope}/snapshot/${attrs.snapshotId}/${attrs.identifier}`
      ),
      '/:scope/new/snapshot-proposals/:snapshotId': redirectRoute(
        (attrs) => `/${attrs.scope}/new/snapshot/${attrs.snapshotId}`
      ),
    }),
  });

  const script = document.createElement('noscript');
  // eslint-disable-next-line max-len
  m.render(script, m.trust('<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KRWH69V" height="0" width="0" style="display:none;visibility:hidden"></iframe>'));
  document.body.insertBefore(script, document.body.firstChild);

  // initialize construct-ui focus manager
  FocusManager.showFocusOnlyOnTab();

  // initialize mixpanel, before adding an alias or tracking identity
  try {
    mixpanel.init('32c32e2c81e63e65dcdd98dc7d2c6811');
    if (document.location.host.startsWith('localhost') || document.location.host.startsWith('127.0.0.1')) {
      mixpanel.disable();
    }
  } catch (e) {
    console.error('Mixpanel initialization error');
  }

  // handle login redirects
  if (m.route.param('loggedin') && m.route.param('loggedin').toString() === 'true'
      && m.route.param('path') && !m.route.param('path').startsWith('/login')) {
    // (we call toString() because m.route.param() returns booleans, even though the types don't reflect this)
    // handle param-based redirect after email login

    /* If we are creating a new account, then we alias to create a new mixpanel user
       else we identify to associate mixpanel events
    */
    if (m.route.param('new') && m.route.param('new').toString() === 'true') {
      console.log('creating account');
      mixpanel.track('Account Creation', {
        'Step No': 1,
        'Step': 'Add Email'
      });
      try {
        mixpanel.alias(m.route.param('email').toString());
      } catch (err) {
        // Don't do anything... Just identify if there is an error
        // mixpanel.identify(m.route.param('email').toString());
      }
    } else {
      console.log('logging in account');
      mixpanel.track('Logged In', {
        Step: 'Email'
      });
      mixpanel.identify(app.user.email);
    }
    m.route.set(m.route.param('path'), {}, { replace: true });
  } else if (localStorage && localStorage.getItem && localStorage.getItem('githubPostAuthRedirect')) {
    // handle localStorage-based redirect after Github login (callback must occur within 30 seconds)
    try {
      const postAuth = JSON.parse(localStorage.getItem('githubPostAuthRedirect'));
      if (postAuth.path && (+new Date() - postAuth.timestamp < 30 * 1000)) {
        m.route.set(postAuth.path, {}, { replace: true });
      }
      localStorage.removeItem('githubPostAuthRedirect');
    } catch (e) {
      console.log('Error restoring path from localStorage');
    }
  } else if (localStorage && localStorage.getItem && localStorage.getItem('discordPostAuthRedirect')) {
    try {
      const postAuth = JSON.parse(localStorage.getItem('discordPostAuthRedirect'));
      if (postAuth.path && (+new Date() - postAuth.timestamp < 30 * 1000)) {
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
  initAppState(true, customDomain).then(async () => {
    // setup notifications and websocket if not already set up
    if (!app.socket) {
      if (app.loginState === LoginState.LoggedIn) {
        // refresh notifications once
        app.user.notifications.refresh().then(() => m.redraw());
        // grab all discussion drafts
        app.user.discussionDrafts.refreshAll().then(() => m.redraw());
        app.socket = new WebSocketController(app.user.jwt);
      }

      handleInviteLinkRedirect();
      // If the user updates their email
      handleUpdateEmailConfirmation();
    }
    m.redraw();
  }).catch((err) => {
    m.redraw();
  });
});

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
