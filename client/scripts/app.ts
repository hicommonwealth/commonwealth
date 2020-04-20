import 'lib/normalize.css';
import 'lib/toastr.css';
import 'lib/flexboxgrid.css';
import 'lity/dist/lity.min.css';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';

import app, { ApiStatus, LoginState } from 'state';

import { Layout, LoadingLayout } from 'views/layouts';
import { ChainInfo, CommunityInfo, NodeInfo,
  OffchainTag, ChainClass, ChainNetwork, NotificationCategory } from 'models';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { default as moment } from 'moment-twitter';
import { default as mixpanel } from 'mixpanel-browser';

import { updateActiveAddresses, updateActiveUser } from 'controllers/app/login';
import Community from './controllers/chain/community/main';
import WebsocketController from './controllers/server/socket/index';
import ConfirmInviteModal from './views/modals/confirm_invite_modal';

// On login: called to initialize the logged-in state, available chains, and other metadata at /api/status
// On logout: called to reset everything
export async function initAppState(updateSelectedNode = true): Promise<void> {
  return new Promise((resolve, reject) => {
    $.get(app.serverUrl() + '/status').then((data) => {
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
          default_chain: app.config.chains.getById(community.default_chain),
          invitesEnabled: community.invitesEnabled,
          privacyEnabled: community.privacyEnabled,
          tags: community.tags,
        }));
      });
      app.login.roles = data.roles || [];
      // app.config.tags = data.tags.map((json) => OffchainTag.fromJSON(json));
      app.config.notificationCategories = data.notificationCategories.map((json) => NotificationCategory.fromJSON(json));
      app.config.invites = data.invites;

      // update the login status
      updateActiveUser(data.user);
      app.loginState = data.user ? LoginState.LoggedIn : LoginState.LoggedOut;

      // add roles data for user
      (data.roles || []).forEach((role) => {
        app.login.roles[role.offchain_community_id || role.chain_id] = role;
      });

      // update the selectedNode, unless we explicitly want to avoid
      // changing the current state (e.g. when logging in through link_new_address_modal)
      if (updateSelectedNode && data.user && data.user.selectedNode) {
        app.login.selectedNode = NodeInfo.fromJSON(data.user.selectedNode);
      }
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });
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
  app.login.selectedNode = null;
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

  // Reset the available addresses, unless we were already on an
  // offchain community in which case no change is needed
  if (!oldCommunity) updateActiveAddresses();

  // Redraw with community fully loaded
  m.redraw();
}

// called by the user, when clicking on the chain/node switcher menu
export async function selectNode(n?: NodeInfo): Promise<void> {
  // Select the default node, if one wasn't provided
  if (!n) {
    if (app.login.selectedNode) {
      n = app.login.selectedNode;
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
    const Edgeware = (await import('./controllers/chain/edgeware/main')).default;
    app.chain = new Edgeware(n, app);
  } else if (n.chain.network === ChainNetwork.Kusama) {
    const Substrate = (await import('./controllers/chain/substrate/main')).default;
    app.chain = new Substrate(n, app);
  } else if (n.chain.network === ChainNetwork.Cosmos) {
    const Cosmos = (await import('./controllers/chain/cosmos/main')).default;
    app.chain = new Cosmos(n, app);
  } else if (n.chain.network === ChainNetwork.Ethereum) {
    const Ethereum = (await import('./controllers/chain/ethereum/main')).default;
    app.chain = new Ethereum(n, app);
  } else if (n.chain.network === ChainNetwork.NEAR) {
    const Near = (await import('./controllers/chain/near/main')).default;
    app.chain = new Near(n, app);
  } else if (n.chain.network === ChainNetwork.Moloch || n.chain.network === ChainNetwork.Metacartel) {
    const Moloch = (await import('./controllers/chain/ethereum/moloch/adapter')).default
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
  await app.chain.init(() => m.redraw());
  console.log(`${n.chain.network.toUpperCase()} started.`);

  // Emit chain as updated
  app.chainReady.next(true);
  handleInviteLinkRedirect();

  // Reset the available addresses only if switching chains
  if (!oldNode || n.chain !== oldNode.chain) {
    updateActiveAddresses(n.chain);
  }

  // Update default on server if logged in
  if (app.isLoggedIn()) {
    $.post(app.serverUrl() + '/selectNode', {
      url: n.url,
      chain: n.chain.id,
      auth: true,
      jwt: app.login.jwt,
    }).then((res) => {
      if (res.status !== 'Success') {
        throw new Error('got unsuccessful status: ' + res.status);
      }
    }).catch((e) => console.error('Failed to select node on server'));
  }

  // Redraw with chain fully loaded
  m.redraw();
}

// set up mithril
m.route.prefix = '';
export const updateRoute = m.route.set;
m.route.set = (...args) => {
  updateRoute.apply(this, args);
  window.scrollTo(0, 0);
};

// set up ontouchmove blocker
document.ontouchmove = (event) => {
  event.preventDefault();
};

// set up moment-twitter
moment.updateLocale('en', {
  relativeTime: {
    future : 'in %s',
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
    notifyError('' + errorMsg);
    return false;
  };

  const redirectRoute = (path: string | Function) => ({
    render: (vnode) => {
      m.route.set((typeof path === 'string' ? path : path(vnode.attrs)), {}, { replace: true });
      return m(LoadingLayout);
    }
  });

  const importRoute = (module, scoped: string | boolean) => ({
    onmatch: (args, path) => {
      return module.then((p) => p.default);
    },
    render: (vnode) => {
      const scope = typeof scoped === 'string'
        // string => scope is defined by route
        ? scoped
        : scoped
          // true => scope is derived from path
          ? vnode.attrs.scope.toString()
          // false => scope is null
          : null;
      return m(Layout, { scope }, [ vnode ]);
    },
  });

  m.route(document.body, '/', {
    // Legacy redirects
    '/unlock':                   redirectRoute('/edgeware/unlock'),
    '/stats/edgeware':           redirectRoute('/edgeware/stats'),
    '/home':                     redirectRoute(`/${app.activeId() || app.config.defaultChain}/`),
    '/discussions':              redirectRoute(`/${app.activeId() || app.config.defaultChain}/`),

    // Landing pages
    '/':                         importRoute(import('views/pages/home'), false),
    '/about':                    importRoute(import('views/pages/landing/about'), false),
    '/terms':                    importRoute(import('views/pages/landing/terms'), false),
    '/privacy':                  importRoute(import('views/pages/landing/privacy'), false),

    // Login page
    '/login':                    importRoute(import('views/pages/login'), false),
    '/settings':                 importRoute(import('views/pages/settings'), false),
    '/subscriptions':            importRoute(import('views/pages/subscriptions'), false),

    // Edgeware lockdrop
    '/edgeware/unlock':          importRoute(import('views/pages/unlock_lockdrop'), false),
    '/edgeware/stats':           importRoute(import('views/stats/edgeware'), false),

    // Chain pages
    '/:scope/home':              redirectRoute((attrs) => `/${attrs.scope}/`),
    '/:scope/discussions':       redirectRoute((attrs) => `/${attrs.scope}/`),
    '/:scope/notifications':     importRoute(import('views/pages/notifications'), true),

    '/:scope':                   importRoute(import('views/pages/discussions'), true),
    '/:scope/discussions/:tag':  importRoute(import('views/pages/discussions'), true),
    '/:scope/proposals':         importRoute(import('views/pages/proposals'), true),
    '/:scope/proposal/:type/:identifier': importRoute(import('views/pages/view_proposal'), true),
    '/:scope/council':           importRoute(import('views/pages/council'), true),
    '/:scope/login':             importRoute(import('views/pages/login'), true),
    '/:scope/new/link':          importRoute(import('views/pages/threads/NewLinkPage'), true),
    '/:scope/new/thread':        importRoute(import('views/pages/threads/NewThreadPage'), true),
    '/:scope/new/signaling':     importRoute(import('views/pages/new_signaling'), true),
    '/:scope/admin':             importRoute(import('views/pages/admin'), true),
    '/:scope/settings':          importRoute(import('views/pages/settings'), true),
    '/:scope/web3login':         importRoute(import('views/pages/web3_login'), true),

    '/:scope/account/:address':  importRoute(import('views/pages/profile'), true),
    '/:scope/account':           redirectRoute((attrs) => {
      return (app.vm.activeAccount)
        ? `/${attrs.scope}/account/${app.vm.activeAccount.address}}`
        : `/${attrs.scope}/`;
    }),

    // '/:scope/questions':         importRoute(import('views/pages/questions'), true),
    // '/:scope/requests':          importRoute(import('views/pages/requests'), true),
    // '/:scope/validators':        importRoute(import('views/pages/validators/index'), true),

    // NEAR login
    '/:scope/finishNearLogin':    importRoute(import('views/pages/finish_near_login'), true),
  });

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
  if (m.route.param('loggedin') && m.route.param('loggedin').toString() === 'true' &&
      m.route.param('path') && !m.route.param('path').startsWith('/login')) {
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
      mixpanel.identify(app.login.email);
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
    if (app.loginState === LoginState.LoggedIn && !app.socket) {
      // refresh notifications once
      app.login.notifications.refresh().then(() => m.redraw());

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

      const socketPurpose = 'server';
      app.socket = new WebsocketController(wsUrl, socketPurpose, app.login.jwt, null);
    }
    m.redraw();
  });
});

///////////////////////////////////////////////////////////
// For browserify-hmr
// See browserify-hmr module.hot API docs for hooks docs.
declare const module: any; // tslint:disable-line no-reserved-keywords
if (module.hot) {
  module.hot.accept();
  // module.hot.dispose((data: any) => {
  // 	m.redraw();
  // })
}
///////////////////////////////////////////////////////////
