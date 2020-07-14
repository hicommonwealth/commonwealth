import 'lib/normalize.css';
import 'lib/toastr.css';
import 'lib/flexboxgrid.css';
import 'lity/dist/lity.min.css';
import 'construct.scss';

import m from 'mithril';
import $ from 'jquery';
import { FocusManager } from 'construct-ui';

import app, { ApiStatus, LoginState } from 'state';

import { Layout, LoadingLayout } from 'views/layout';
import { ChainInfo, CommunityInfo, NodeInfo, ChainNetwork, NotificationCategory, Notification } from 'models';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import moment from 'moment-twitter';
import mixpanel from 'mixpanel-browser';

import { WebsocketMessageType, IWebsocketsPayload } from 'types';
import { clearActiveAddresses, updateActiveAddresses, updateActiveUser } from 'controllers/app/login';
import Community from './controllers/chain/community/main';
import WebsocketController from './controllers/server/socket/index';
import ConfirmInviteModal from './views/modals/confirm_invite_modal';

// On login: called to initialize the logged-in state, available chains, and other metadata at /api/status
// On logout: called to reset everything
export async function initAppState(updateSelectedNode = true): Promise<void> {
  return new Promise((resolve, reject) => {
    $.get(`${app.serverUrl()}/status`).then((data) => {
      app.config.chains.clear();
      app.config.nodes.clear();
      app.config.communities.clear();
      data.chains.map((chain) => app.config.chains.add(ChainInfo.fromJSON(chain)));
      data.nodes.map((node) => {
        return app.config.nodes.add(NodeInfo.fromJSON({
          id: node.id,
          url: node.url,
          chain: app.config.chains.getById(node.chain),
          address: node.address,
        }));
      });
      data.communities.map((community) => {
        return app.config.communities.add(CommunityInfo.fromJSON({
          id: community.id,
          name: community.name,
          description: community.description,
          website: community.website,
          chat: community.chat,
          default_chain: app.config.chains.getById(community.default_chain),
          invitesEnabled: community.invitesEnabled,
          privacyEnabled: community.privacyEnabled,
          featuredTags: community.featured_tags,
          tags: community.tags,
        }));
      });
      app.user.setRoles(data.roles);
      // app.config.tags = data.tags.map((json) => OffchainTag.fromJSON(json));
      app.config.notificationCategories = data.notificationCategories
        .map((json) => NotificationCategory.fromJSON(json));
      app.config.invites = data.invites;

      // update the login status
      updateActiveUser(data.user);
      app.loginState = data.user ? LoginState.LoggedIn : LoginState.LoggedOut;
      app.user.setStarredCommunities(data.user ? data.user.starredCommunities : []);

      // update the selectedNode, unless we explicitly want to avoid
      // changing the current state (e.g. when logging in through link_new_address_modal)
      if (updateSelectedNode && data.user && data.user.selectedNode) {
        app.user.setSelectedNode(NodeInfo.fromJSON(data.user.selectedNode));
      }
      resolve();
    }).catch((err: any) => {
      app.loadingError = err.responseJSON.error;
      reject(err);
    });
  });
}

export async function deinitChainOrCommunity() {
  if (app.chain) {
    app.chain.networkStatus = ApiStatus.Disconnected;
    await app.chain.deinit();
    app.chain = null;
  }
  if (app.community) {
    await app.community.deinit();
    app.community = null;
  }
  app.user.setSelectedNode(null);
  clearActiveAddresses();
}

export function handleInviteLinkRedirect() {
  if (m.route.param('invitemessage')) {
    mixpanel.track('Invite Link Used', {
      'Step No': 1,
      'Step': m.route.param('invitemessage'),
    });
    if (m.route.param('invitemessage') === 'failure') {
      const message = m.route.param('message');
      notifyError(message);
    } else if (m.route.param('invitemessage') === 'success') {
      app.modals.create({ modal: ConfirmInviteModal });
    } else {
      notifyError('Hmmmm... URL not constructed properly');
    }
  }
}

export async function selectCommunity(c?: CommunityInfo): Promise<void> {
  // Check for valid community selection, and that we need to switch
  if (app.community && c === app.community.meta) return;

  // Shut down old chain if applicable
  const oldCommunity = app.community && app.community.meta;
  await deinitChainOrCommunity();

  // Initialize the community
  app.community = new Community(c, app);
  await app.community.init();
  console.log(`${c.name.toUpperCase()} started.`);

  // Initialize available addresses
  updateActiveAddresses();

  // Redraw with community fully loaded
  m.redraw();
}

// called by the user, when clicking on the chain/node switcher menu
export async function selectNode(n?: NodeInfo): Promise<void> {
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
  if ((Object.values(ChainNetwork) as any).indexOf(n.chain.network) === -1) {
    throw new Error('invalid chain');
  }

  // Shut down old chain if applicable
  const oldNode = app.chain && app.chain.meta;
  await deinitChainOrCommunity();
  setTimeout(() => m.redraw()); // redraw to show API status indicator

  // Initialize modules.
  if (n.chain.network === ChainNetwork.Edgeware) {
    const Edgeware = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "edgeware-main" */
      './controllers/chain/edgeware/main'
    )).default;
    app.chain = new Edgeware(n, app);
  } else if (n.chain.network === ChainNetwork.Kusama) {
    const Kusama = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "kusama-main" */
      './controllers/chain/kusama/main'
    )).default;
    app.chain = new Kusama(n, app);
  } else if (n.chain.network === ChainNetwork.Polkadot) {
    const Polkadot = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "kusama-main" */
      './controllers/chain/polkadot/main'
    )).default;
    app.chain = new Polkadot(n, app);
  } else if (n.chain.network === ChainNetwork.Cosmos) {
    const Cosmos = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "cosmos-main" */
      './controllers/chain/cosmos/main'
    )).default;
    app.chain = new Cosmos(n, app);
  } else if (n.chain.network === ChainNetwork.Ethereum) {
    const Ethereum = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "ethereum-main" */
      './controllers/chain/ethereum/main'
    )).default;
    app.chain = new Ethereum(n, app);
  } else if (n.chain.network === ChainNetwork.NEAR) {
    const Near = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "near-main" */
      './controllers/chain/near/main'
    )).default;
    app.chain = new Near(n, app);
  } else if (n.chain.network === ChainNetwork.Moloch || n.chain.network === ChainNetwork.Metacartel) {
    const Moloch = (await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "moloch-main" */
      './controllers/chain/ethereum/moloch/adapter'
    )).default;
    app.chain = new Moloch(n, app);
  } else {
    throw new Error('Invalid chain');
  }

  // Initialize the chain, providing an m.redraw() to a callback,
  // which is called before chain initialization finishes but after
  // the server is loaded. This allows the navbar/header to be redrawn
  // to show progress, before all modules are loaded.
  //
  // NOTE: While awaiting app.chain.init() to complete, the chain may
  // be uninitialized, but app.chain is set, so there may be subtle
  // race conditions that appear at this point if certain modules come
  // online before others. The solution should be to have some kind of
  // locking in place before modules start working.
  //
  app.chain.init(() => m.redraw()).then(() => {
    // Emit chain as updated
    app.chainAdapterReady.next(true);
    console.log(`${n.chain.network.toUpperCase()} started.`);
    // Instantiate Account<> objects again, in case they could not be instantiated without the chain fully loaded
    updateActiveAddresses(n.chain);
  });

  // If the user was invited to a chain/community, we can now pop up a dialog for them to accept the invite
  handleInviteLinkRedirect();

  // Try to instantiate Account<> objects for the new chain. However, app.chain.accounts.get() may not be able to
  // create the Account object, so we also call this again in the callback that runs after the chain initializes
  updateActiveAddresses(n.chain);

  // Update default on server if logged in
  if (app.isLoggedIn()) {
    await app.user.selectNode({
      url: n.url,
      chain: n.chain.id
    });
  }

  // Redraw with chain fully loaded
  m.redraw();
}

// called by the LayoutWithChain wrapper, which is triggered when the
// user navigates to a page scoped to a particular chain
export function initChain(chainId: string): Promise<void> {
  if (chainId) {
    const chainNodes = app.config.nodes.getByChain(chainId);
    if (chainNodes && chainNodes.length > 0) {
      return selectNode(chainNodes[0]);
    } else {
      throw new Error(`No nodes found for '${chainId}'`);
    }
  } else {
    throw new Error(`No nodes found for '${chainId}'`);
  }
}

export function initCommunity(communityId: string): Promise<void> {
  const community = app.config.communities.getByCommunity(communityId);
  if (community && community.length > 0) {
    return selectCommunity(community[0]);
  } else {
    throw new Error(`No community found for '${communityId}'`);
  }
}

// set up mithril
m.route.prefix = '';
export const updateRoute = m.route.set;
m.route.set = (...args) => {
  updateRoute.apply(this, args);
  // wait until any redraws have happened before setting the scroll position
  setTimeout(() => {
    const html = document.getElementsByTagName('html')[0];
    if (html) html.scrollTo(0, 0);
    const body = document.getElementsByTagName('body')[0];
    if (body) body.scrollTo(0, 0);
  }, 0);
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
  window.onerror = (errorMsg, url, lineNumber, colNumber, error) => {
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
    wideLayout?: boolean;
  }

  const importRoute = (path, attrs: RouteAttrs) => ({
    onmatch: () => {
      return import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "route-[request]" */
        `./${path}`
      ).then((p) => p.default);
    },
    render: (vnode) => {
      const { scoped, wideLayout } = attrs;
      const scope = typeof scoped === 'string'
        // string => scope is defined by route
        ? scoped
        : scoped
          // true => scope is derived from path
          ? vnode.attrs.scope.toString()
          // false => scope is null
          : null;
      return m(Layout, { scope, wideLayout }, [ vnode ]);
    },
  });

  m.route(document.body, '/', {
    // Legacy redirects
    '/unlock':                   redirectRoute('/edgeware/unlock'),
    '/stats/edgeware':           redirectRoute('/edgeware/stats'),
    '/home':                     redirectRoute(`/${app.activeId() || app.config.defaultChain}/`),
    '/discussions':              redirectRoute(`/${app.activeId() || app.config.defaultChain}/`),

    // Landing pages
    '/':                         importRoute('views/pages/home', { scoped: false, wideLayout: true }),
    '/about':                    importRoute('views/pages/landing/about', { scoped: false }),
    '/terms':                    importRoute('views/pages/landing/terms', { scoped: false }),
    '/privacy':                  importRoute('views/pages/landing/privacy', { scoped: false }),

    // Login page
    '/login':                    importRoute('views/pages/login', { scoped: false }),
    '/settings':                 importRoute('views/pages/settings', { scoped: false }),
    '/notifications':            importRoute('views/pages/notifications', { scoped: false }),
    '/notification-settings':    importRoute('views/pages/notification-settings', { scoped: false }),

    // Edgeware lockdrop
    '/edgeware/unlock':          importRoute('views/pages/unlock_lockdrop', { scoped: false }),
    '/edgeware/stats':           importRoute('views/stats/edgeware', { scoped: false }),

    // Chain pages
    '/:scope/home':              redirectRoute((attrs) => `/${attrs.scope}/`),
    '/:scope/discussions':       redirectRoute((attrs) => `/${attrs.scope}/`),

    '/:scope':                   importRoute('views/pages/discussions', { scoped: true }),
    '/:scope/discussions/:tag': importRoute('views/pages/discussions', { scoped: true }),
    // '/:scope/chat':              importRoute('views/pages/chat', { scoped: true }),
    '/:scope/proposals':         importRoute('views/pages/proposals', { scoped: true }),
    '/:scope/proposal/:type/:identifier': importRoute('views/pages/view_proposal/index', { scoped: true }),
    '/:scope/council':           importRoute('views/pages/council', { scoped: true }),
    '/:scope/login':             importRoute('views/pages/login', { scoped: true }),
    '/:scope/new/thread':        importRoute('views/pages/new_thread', { scoped: true }),
    '/:scope/new/signaling':     importRoute('views/pages/new_signaling', { scoped: true }),
    '/:scope/new/proposal/:type': importRoute('views/pages/new_proposal/index', { scoped: true }),
    '/:scope/admin':             importRoute('views/pages/admin', { scoped: true }),
    '/:scope/settings':          importRoute('views/pages/settings', { scoped: true }),
    '/:scope/web3login':         importRoute('views/pages/web3login', { scoped: true }),

    '/:scope/account/:address':  importRoute('views/pages/profile', { scoped: true }),
    '/:scope/account':           redirectRoute((attrs) => {
      return (app.user.activeAccount)
        ? `/${attrs.scope}/account/${app.user.activeAccount.address}`
        : `/${attrs.scope}/`;
    }),

    // '/:scope/questions':         importRoute('views/pages/questions', { scoped: true }),
    // '/:scope/requests':          importRoute('views/pages/requests', { scoped: true }),
    // '/:scope/validators':        importRoute('views/pages/validators', { scoped: true }),

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
    notifySuccess('Logged in');
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
      }
      // grab discussion drafts
      if (app.loginState === LoginState.LoggedIn) {
        app.user.discussionDrafts.refreshAll().then(() => m.redraw());
      }

      let wsUrl = app.serverUrl();
      if (app.serverUrl().indexOf('https')) {
        wsUrl = wsUrl.replace('https', 'ws');
      }

      if (app.serverUrl().indexOf('http') !== -1) {
        wsUrl = wsUrl.replace('http', 'ws');
      }

      if (app.serverUrl().indexOf('/api') !== -1) {
        wsUrl = wsUrl.replace('/api', '');
      }

      if (app.serverUrl().indexOf('://') === -1) {
        if (wsUrl.length === 0) {
          wsUrl = 'ws://localhost:8080';
        } else {
          wsUrl = `ws://${app.serverUrl()}`;
        }
      }

      handleInviteLinkRedirect();

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
