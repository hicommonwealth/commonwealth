import 'lib/normalize.css';
import 'lib/flexboxgrid.css';
import 'lity/dist/lity.min.css';
import 'construct.scss';
// import 'tailwindcss/tailwind.css';
import '../styles/style.css';
import '../styles/lib/style.css';

import m from 'mithril';
import $ from 'jquery';
import { FocusManager } from 'construct-ui';
import moment from 'moment';
import mixpanel from 'mixpanel-browser';

import app, { ApiStatus, LoginState } from 'state';
import {
  ChainInfo,
  CommunityInfo,
  NodeInfo,
  ChainNetwork,
  NotificationCategory,
  Notification,
} from 'models';
import { WebsocketMessageType, IWebsocketsPayload } from 'types';

import { notifyError, notifySuccess, notifyInfo } from 'controllers/app/notifications';
import { updateActiveAddresses, updateActiveUser } from 'controllers/app/login';
import Community from 'controllers/chain/community/main';
import WebsocketController from 'controllers/server/socket/index';

import { Layout, LoadingLayout } from 'views/layout';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import LoginModal from 'views/modals/login_modal';
import { alertModalWithText } from 'views/modals/alert_modal';
import Login from './views/components/login';

// Prefetch commonly used pages
import(/* webpackPrefetch: true */ 'views/pages/landing');
import(/* webpackPrefetch: true */ 'views/pages/commonwealth');
import(/* webpackPrefetch: true */ 'views/pages/discussions');
import(/* webpackPrefetch: true */ 'views/pages/view_proposal');

// On login: called to initialize the logged-in state, available chains, and other metadata at /api/status
// On logout: called to reset everything
export async function initAppState(updateSelectedNode = true): Promise<void> {
  return new Promise((resolve, reject) => {
    $.get(`${app.serverUrl()}/status`).then((data) => {
      app.config.chains.clear();
      app.config.nodes.clear();
      app.config.communities.clear();
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
        }));
      });
      data.communities.sort((a, b) => a.id - b.id).map((community) => {
        return app.config.communities.add(CommunityInfo.fromJSON({
          id: community.id,
          name: community.name,
          description: community.description,
          iconUrl: community.iconUrl,
          website: community.website,
          discord: community.discord,
          element: community.element,
          telegram: community.telegram,
          github: community.github,
          default_chain: app.config.chains.getById(community.default_chain),
          visible: community.visible,
          collapsed_on_homepage: community.collapsed_on_homepage,
          invitesEnabled: community.invitesEnabled,
          privacyEnabled: community.privacyEnabled,
          featuredTopics: community.featured_topics,
          topics: community.topics,
        }));
      });
      app.user.setRoles(data.roles);
      // app.config.topics = data.topics.map((json) => OffchainTopic.fromJSON(json));
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
      app.user.setStarredCommunities(data.user ? data.user.starredCommunities : []);

      // update the selectedNode, unless we explicitly want to avoid
      // changing the current state (e.g. when logging in through link_new_address_modal)
      if (updateSelectedNode && data.user && data.user.selectedNode) {
        app.user.setSelectedNode(NodeInfo.fromJSON(data.user.selectedNode));
      }

      // update whether we're on a custom domain
      const host = document.location.host;
      app.setIsCustomDomain(
        app.config.chains.getAll().find((c) => c.customDomain === host) !== undefined
          || app.config.communities.getAll().find((c) => c.customDomain === host) !== undefined
      );

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
    app.chain = null;
  }
  if (app.community) {
    await app.community.deinit();
    app.community = null;
  }
  app.user.setSelectedNode(null);
  app.user.setActiveAccounts([]);
  app.user.ephemerallySetActiveAccount(null);
}

export function handleInviteLinkRedirect() {
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

export function handleUpdateEmailConfirmation() {
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

export async function selectCommunity(c?: CommunityInfo): Promise<boolean> {
  // Check for valid community selection, and that we need to switch
  if (app.community && c === app.community.meta) return;

  // Shut down old chain if applicable
  await deinitChainOrCommunity();

  // Begin initializing the community
  const newCommunity = new Community(c, app);
  const finalizeInitialization = await newCommunity.init();

  // If the user is still in the initializing community, finalize the
  // initialization; otherwise, abort and return false
  if (!finalizeInitialization) {
    return false;
  } else {
    app.community = newCommunity;
  }
  console.log(`${c.name.toUpperCase()} started.`);

  // Initialize available addresses
  await updateActiveAddresses();

  // Redraw with community fully loaded and return true to indicate
  // initialization has finalized.
  m.redraw();
  return true;
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
  if ((Object.values(ChainNetwork) as any).indexOf(n.chain.network) === -1 && n.chain.type !== 'token') {
    throw new Error('invalid chain');
  }

  // Shut down old chain if applicable
  await deinitChainOrCommunity();
  app.chainPreloading = true;
  setTimeout(() => m.redraw()); // redraw to show API status indicator

  // Import top-level chain adapter lazily, to facilitate code split.
  let newChain;
  let initApi; // required for NEAR
  if (n.chain.network === ChainNetwork.Edgeware) {
    const Edgeware = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "edgeware-main" */
      './controllers/chain/edgeware/main'
    )).default;
    newChain = new Edgeware(n, app);
  } else if (n.chain.network === ChainNetwork.Kusama) {
    const Kusama = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "kusama-main" */
      './controllers/chain/kusama/main'
    )).default;
    newChain = new Kusama(n, app);
  } else if (n.chain.network === ChainNetwork.Polkadot) {
    const Polkadot = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "kusama-main" */
      './controllers/chain/polkadot/main'
    )).default;
    newChain = new Polkadot(n, app);
  } else if (n.chain.network === ChainNetwork.Kulupu) {
    const Kulupu = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "kulupu-main" */
      './controllers/chain/kulupu/main'
    )).default;
    newChain = new Kulupu(n, app);
  } else if (n.chain.network === ChainNetwork.Plasm) {
    const Plasm = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "plasm-main" */
      './controllers/chain/plasm/main'
    )).default;
    newChain = new Plasm(n, app);
  } else if (n.chain.network === ChainNetwork.Stafi) {
    const Stafi = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "stafi-main" */
      './controllers/chain/stafi/main'
    )).default;
    newChain = new Stafi(n, app);
  } else if (n.chain.network === ChainNetwork.Darwinia) {
    const Darwinia = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "darwinia-main" */
      './controllers/chain/darwinia/main'
    )).default;
    newChain = new Darwinia(n, app);
  } else if (n.chain.network === ChainNetwork.Phala) {
    const Phala = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "phala-main" */
      './controllers/chain/phala/main'
    )).default;
    newChain = new Phala(n, app);
  } else if (n.chain.network === ChainNetwork.Centrifuge) {
    const Centrifuge = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "centrifuge-main" */
      './controllers/chain/centrifuge/main'
    )).default;
    newChain = new Centrifuge(n, app);
  } else if (n.chain.network === ChainNetwork.Cosmos) {
    const Cosmos = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "cosmos-main" */
      './controllers/chain/cosmos/main'
    )).default;
    newChain = new Cosmos(n, app);
  } else if (n.chain.network === ChainNetwork.Straightedge) {
    const Straightedge = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "straightedge-main" */
      './controllers/chain/straightedge/main'
    )).default;
    newChain = new Straightedge(n, app);
  } else if (n.chain.network === ChainNetwork.Ethereum) {
    const Ethereum = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "ethereum-main" */
      './controllers/chain/ethereum/main'
    )).default;
    newChain = new Ethereum(n, app);
  } else if (n.chain.network === ChainNetwork.NEAR) {
    const Near = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "near-main" */
      './controllers/chain/near/main'
    )).default;
    newChain = new Near(n, app);
    initApi = true;
  } else if (n.chain.network === ChainNetwork.Clover) {
    const Clover = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "clover-main" */
      './controllers/chain/clover/main'
    )).default;
    newChain = new Clover(n, app);
  } else if (n.chain.network === ChainNetwork.HydraDX) {
    const HydraDX = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "hydradx-main" */
      './controllers/chain/hydradx/main'
    )).default;
    newChain = new HydraDX(n, app);
  } else if (n.chain.network === ChainNetwork.Moloch || n.chain.network === ChainNetwork.Metacartel) {
    const Moloch = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "moloch-main" */
      './controllers/chain/ethereum/moloch/adapter'
    )).default;
    newChain = new Moloch(n, app);
  } else if (n.chain.network === ChainNetwork.Marlin || n.chain.network === ChainNetwork.MarlinTestnet) {
    const Marlin = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "marlin-main" */
      './controllers/chain/ethereum/marlin/adapter'
    )).default;
    newChain = new Marlin(n, app);
  } else if (n.chain.type === 'token') {
    const Token = (await import(
    //   /* webpackMode: "lazy" */
    //   /* webpackChunkName: "token-main" */
      './controllers/chain/ethereum/token/adapter'
    )).default;
    newChain = new Token(n, app);
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
  // initialization; otherwise, abort and return false
  if (!finalizeInitialization) {
    app.chainPreloading = false;
    return false;
  } else {
    app.chain = newChain;
  }
  if (initApi) {
    app.chain.initApi(); // required for loading NearAccounts
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

export function initCommunity(communityId: string): Promise<boolean> {
  const community = app.config.communities.getByCommunity(communityId);
  if (community && community.length > 0) {
    return selectCommunity(community[0]);
  } else {
    throw new Error(`No community found for '${communityId}'`);
  }
}

export async function initNewTokenChain(address: string) {
  const response = await $.getJSON('/api/getTokenForum', { address });
  if (response.status !== 'Success') {
    // TODO: better custom 404
    m.route.set('/404');
  }
  const { chain, node } = response.result;
  const chainInfo = ChainInfo.fromJSON(chain);
  const nodeInfo = new NodeInfo(node.id, chainInfo, node.url, node.address);
  if (!app.config.chains.getById(chainInfo.id)) {
    app.config.chains.add(chainInfo);
    app.config.nodes.add(nodeInfo);
  }
  console.log(nodeInfo, chainInfo);
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

$(() => {
  // set window error handler
  // ignore ResizeObserver error: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
  const resizeObserverLoopErrRe = /^ResizeObserver loop limit exceeded/;
  // replace chunk loading errors with a notification that the app has been updated
  const chunkLoadingErrRe = /^Uncaught SyntaxError: Unexpected token '<'/;
  window.onerror = (errorMsg, url, lineNumber, colNumber, error) => {
    if (typeof errorMsg === 'string' && resizeObserverLoopErrRe.test(errorMsg)) return false;
    if (typeof errorMsg === 'string' && chunkLoadingErrRe.test(errorMsg)) {
      alertModalWithText(
        'A new version of the application has been released. Please save your work and refresh.',
        'Okay'
      )();
      return false;
    }
    notifyError(`${errorMsg}`);
    return false;
  };

  const redirectRoute = (path: string | Function) => ({
    render: (vnode) => {
      m.route.set((typeof path === 'string' ? path : path(vnode.attrs)), {}, { replace: true });
      return m(LoadingLayout);
    }
  });

  interface RouteAttrs {
    scoped: string | boolean;
    hideSidebar?: boolean;
    deferChain?: boolean;
    redirectCustomDomain?: boolean;
  }

  const importRoute = (path: string, attrs: RouteAttrs) => ({
    onmatch: () => {
      return import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "route-[request]" */
        `./${path}`
      ).then((p) => p.default);
    },
    render: (vnode) => {
      const { scoped, hideSidebar, redirectCustomDomain } = attrs;
      // handle custom domains, for routes that need special handling
      const host = document.location.host;
      if (redirectCustomDomain) {
        const hasLoadedAll = app.config.chains.getAll().length !== 0 || app.config.communities.getAll().length !== 0;
        const matchingChain = app.config.chains.getAll().find((c) => c.customDomain === host);
        const matchingCommunity = app.config.communities.getAll().find((c) => c.customDomain === host);

        // keep the page loading until chains & communities have been fetched
        if (!hasLoadedAll) return m(LoadingLayout);

        // redirect into the community
        if (matchingChain) {
          m.route.set(`/${matchingChain.id}`, {}, { replace: true });
          return m(LoadingLayout);
        }
        if (matchingCommunity) {
          m.route.set(`/${matchingCommunity.id}`, {}, { replace: true });
          return m(LoadingLayout);
        }
      }

      // normal render
      let deferChain = attrs.deferChain;
      const scope = typeof scoped === 'string'
        // string => scope is defined by route
        ? scoped
        : scoped
          // true => scope is derived from path
          ? vnode.attrs.scope.toString()
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
      if (vnode.attrs.scope && path === 'views/pages/view_proposal/index' && vnode.attrs.type === 'discussion') {
        deferChain = true;
      }
      if (app.chain?.meta.chain.type === 'token') deferChain = false;
      return m(Layout, { scope, deferChain, hideSidebar }, [ vnode ]);
    },
  });



  m.route(document.body, '/', {
    // Legacy redirects
    '/unlock':                   redirectRoute('/edgeware/unlock'),
    '/stats/edgeware':           redirectRoute('/edgeware/stats'),
    '/home':                     redirectRoute(`/${app.activeId() || app.config.defaultChain}/`),
    '/discussions':              redirectRoute(`/${app.activeId() || app.config.defaultChain}/`),

    // Landing pages
    '/':                         importRoute('views/pages/landing', { scoped: false, hideSidebar: true }),
    '/whyCommonWealth':          importRoute('views/pages/commonwealth', { scoped: false, hideSidebar: true }),
    '/about':                    importRoute('views/pages/landing/about', { scoped: false }),
    '/terms':                    importRoute('views/pages/landing/terms', { scoped: false }),
    '/privacy':                  importRoute('views/pages/landing/privacy', { scoped: false }),
    '/components':               importRoute('views/pages/components', { scoped: false, hideSidebar: true }),

    // Login page
    '/login':                    importRoute('views/pages/login', { scoped: false }),
    '/settings':                 importRoute('views/pages/settings', { scoped: false }),
    '/notifications':            redirectRoute(() => '/edgeware/notifications'),
    '/:scope/notifications':     importRoute('views/pages/notifications', { scoped: true, deferChain: true }),
    '/notificationsList':        redirectRoute(() => '/edgeware/notificationsList'),
    '/:scope/notificationsList': importRoute('views/pages/notificationsList', { scoped: true, deferChain: true }),

    // Edgeware lockdrop
    '/edgeware/unlock':          importRoute('views/pages/unlock_lockdrop', { scoped: false }),
    '/edgeware/stats':           importRoute('views/stats/edgeware', { scoped: false }),

    // Commonwealth protocol
    '/:scope/projects':          importRoute('views/pages/commonwealth/projects', { scoped: true }),
    // '/:scope/backers':           importRoute('views/pages/commonwealth/backers', { scoped: true }),
    '/:scope/collectives':       importRoute('views/pages/commonwealth/collectives', { scoped: true }),

    // Chain pages
    '/:scope/home':              redirectRoute((attrs) => `/${attrs.scope}/`),
    '/:scope/discussions':       redirectRoute((attrs) => `/${attrs.scope}/`),

    '/:scope':                   importRoute('views/pages/discussions', { scoped: true, deferChain: true }),
    '/:scope/discussions/:topic': importRoute('views/pages/discussions', { scoped: true, deferChain: true }),
    '/:scope/search':            importRoute('views/pages/search', { scoped: true, deferChain: true }),
    '/:scope/members':           importRoute('views/pages/members', { scoped: true, deferChain: true }),
    '/:scope/chat':              importRoute('views/pages/chat', { scoped: true, deferChain: true }),
    '/:scope/referenda':         importRoute('views/pages/referenda', { scoped: true }),
    '/:scope/proposals':         importRoute('views/pages/proposals', { scoped: true }),
    '/:scope/treasury':          importRoute('views/pages/treasury', { scoped: true }),
    '/:scope/bounties':          importRoute('views/pages/bounties', { scoped: true }),
    '/:scope/proposal/:type/:identifier': importRoute('views/pages/view_proposal/index', { scoped: true }),
    '/:scope/council':           importRoute('views/pages/council', { scoped: true }),
    '/:scope/delegate':          importRoute('views/pages/delegate', { scoped: true, }),
    '/:scope/login':             importRoute('views/pages/login', { scoped: true, deferChain: true }),
    '/:scope/new/thread':        importRoute('views/pages/new_thread', { scoped: true, deferChain: true }),
    '/:scope/new/proposal/:type': importRoute('views/pages/new_proposal/index', { scoped: true }),
    '/:scope/admin':             importRoute('views/pages/admin', { scoped: true }),
    '/:scope/settings':          importRoute('views/pages/settings', { scoped: true }),
    '/:scope/analytics':         importRoute('views/pages/stats', { scoped: true, deferChain: true }),
    '/:scope/web3login':         importRoute('views/pages/web3login', { scoped: true }),

    '/:scope/account/:address':  importRoute('views/pages/profile', { scoped: true, deferChain: true }),
    '/:scope/account':           redirectRoute((attrs) => {
      return (app.user.activeAccount)
        ? `/${attrs.scope}/account/${app.user.activeAccount.address}`
        : `/${attrs.scope}/`;
    }),

    '/:scope/validators':        importRoute('views/pages/validators', { scoped: true }),

    // NEAR login
    '/:scope/finishNearLogin':    importRoute('views/pages/finish_near_login', { scoped: true }),
  });

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
  }
  if (m.route.param('loggedin')) {
    notifySuccess('Logged in!');
  } else if (m.route.param('loginerror')) {
    notifyError('Could not log in');
    console.error(m.route.param('loginerror'));
  }

  // initialize the app
  initAppState().then(() => {
    // setup notifications and websocket if not already set up
    if (!app.socket) {
      let jwt;
      // refresh notifications once
      if (app.loginState === LoginState.LoggedIn) {
        app.user.notifications.refresh().then(() => m.redraw());
        jwt = app.user.jwt;
        m.route.set('/');
      }
      // grab discussion drafts
      if (app.loginState === LoginState.LoggedIn) {
        app.user.discussionDrafts.refreshAll().then(() => m.redraw());
      }

      handleInviteLinkRedirect();

      // If the user updates their email
      handleUpdateEmailConfirmation();

      // subscribe to notifications
      const wsUrl = document.location.origin
        .replace('http://', 'ws://')
        .replace('https://', 'wss://');
      app.socket = new WebsocketController(wsUrl, jwt, null);
      if (app.loginState === LoginState.LoggedIn) {
        app.socket.addListener(
          WebsocketMessageType.Notification,
          (payload: IWebsocketsPayload<any>) => {
            if (payload.data && payload.data.subscription_id) {
              const subscription = app.user.notifications.subscriptions.find(
                (sub) => sub.id === payload.data.subscription_id
              );
              // note that payload.data should have the correct JSON form
              if (subscription) {
                console.log('adding new notification from websocket:', payload.data);
                const notification = Notification.fromJSON(payload.data, subscription);
                app.user.notifications.update(notification);
                m.redraw();
              }
            } else {
              console.error('got invalid notification payload:', payload);
            }
          },
        );
      }
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
