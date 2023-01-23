import { alertModalWithText } from 'views/modals/alert_modal';
import { pathIsDiscussion } from 'identifiers';
import app from 'state';
import { ChainType } from 'common-common/src/types';
import m from 'mithril';
import { Layout } from 'views/layout';
import {
  APPLICATION_UPDATE_ACTION,
  APPLICATION_UPDATE_MESSAGE,
} from 'helpers/constants';
import { notifyError, notifyInfo } from 'controllers/app/notifications';
import { NewLoginModal } from 'views/modals/login_modal';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import { ConfirmInviteModal } from 'views/modals/confirm_invite_modal';

interface RouteAttrs {
  scoped?: boolean;
  hideSidebar?: boolean;
  deferChain?: boolean;
}

interface ShouldDeferChainAttrs {
  deferChain: boolean;
  scope: string;
  type: string;
  path: string;
}

// set up route navigation
m.route.prefix = '';
const _updateRoute = m.route.set;

m.route.set = (...args) => {
  // set app params that maintain global state for:
  // - whether the user last clicked the back button
  // - the last page the user was on
  app._lastNavigatedBack = false;
  app._lastNavigatedFrom = m.route.get();

  // update route
  if (args[0] !== m.route.get()) {
    _updateRoute.apply(this, args);
  }

  // reset scroll position
  const html = document.getElementsByTagName('html')[0];

  if (html) {
    html.scrollTo(0, 0);
  }

  const body = document.getElementsByTagName('body')[0];

  if (body) {
    body.scrollTo(0, 0);
  }
};

const _onpopstate = window.onpopstate;
window.onpopstate = (...args) => {
  app._lastNavigatedBack = true;
  app._lastNavigatedFrom = m.route.get();

  if (_onpopstate) {
    _onpopstate.apply(this, args);
  }
};

const navigateToSubpage = (...args) => {
  // prepend community if we are not on a custom domain
  if (!app.isCustomDomain() && app.activeChainId()) {
    args[0] = `/${app.activeChainId()}${args[0]}`;
  }
  app.sidebarMenu = 'default';
  m.route.set.apply(this, args);
};

const shouldDeferChain = ({
  deferChain,
  scope,
  type,
  path,
}: ShouldDeferChainAttrs) => {
  // Special case to defer chain loading specifically for viewing an offchain thread. We need
  // a special case because Threads and on-chain proposals are all viewed through the
  // same "/:scope/proposal/:type/:id" route.
  // let deferChain = attrs.deferChain;

  const isDiscussion =
    type === 'discussion' || pathIsDiscussion(scope, window.location.pathname);

  if (path === 'views/pages/view_proposal/index' && isDiscussion) {
    return true;
  }

  if (app.chain?.meta.type === ChainType.Token) {
    return false;
  }

  return deferChain;
};

const redirectRoute = (
  path: string | ((attrs: Record<string, unknown>) => string)
) => ({
  render: (vnode) => {
    m.route.set(
      typeof path === 'string' ? path : path(vnode.attrs),
      {},
      { replace: true }
    );

    return m(Layout);
  },
});

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

let hasCompletedSuccessfulPageLoad = false;

const renderRoute = (
  path: string,
  attrs: RouteAttrs,
  customDomain: string
) => ({
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
        console.error(err);

        if (err.name === 'ChunkLoadError') {
          alertModalWithText(
            APPLICATION_UPDATE_MESSAGE,
            APPLICATION_UPDATE_ACTION
          )();
        }

        // return to the last page, if it was on commonwealth
        if (hasCompletedSuccessfulPageLoad) {
          window.history.back();
        }
      });
  },
  render: (vnode) => {
    const { scoped = false, hideSidebar } = attrs || {};

    const pathScope = vnode.attrs.scope?.toString() || customDomain;
    const scope = scoped ? pathScope : null;

    const deferChain = shouldDeferChain({
      deferChain: vnode.attrs.deferChain,
      scope,
      type: vnode.attrs.type,
      path,
    });

    return m(Layout, { scope, deferChain, hideSidebar }, [vnode]);
  },
});

const getCustomDomainRoutes = (importRoute) => ({
  // Custom domain routes
  '/': importRoute('views/pages/discussions_redirect', {
    scoped: true,
  }),
  '/web3login': redirectRoute(() => '/'),
  '/search': importRoute('views/pages/search', {
    deferChain: true,
  }),

  // Notifications
  '/notification-settings': importRoute('views/pages/notification_settings', {
    scoped: true,
    deferChain: true,
  }),
  '/notifications': importRoute('views/pages/notifications_page', {
    scoped: true,
    deferChain: true,
  }),

  // NEAR
  '/finishNearLogin': importRoute('views/pages/finish_near_login', {
    scoped: true,
  }),
  '/finishaxielogin': importRoute('views/pages/finish_axie_login', {
    scoped: true,
  }),

  // General Contracts
  '/new/contract': importRoute('views/pages/new_contract', {
    scoped: true,
    deferChain: true,
  }),
  '/contract/:contractAddress': importRoute('views/pages/general_contract', {
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
  '/account': redirectRoute(() =>
    app.user.activeAccount ? `/account/${app.user.activeAccount.address}` : '/'
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
  '/:scope/proposal/discussion/:identifier': redirectRoute(
    (attrs) => `/discussion/${attrs.identifier}`
  ),
  '/proposal/:identifier': importRoute('views/pages/view_proposal/index', {
    scoped: true,
  }),
  '/discussion/:identifier': importRoute('views/pages/view_thread/index', {
    scoped: true,
  }),
  '/new/proposal/:type': importRoute('views/pages/new_proposal/index', {
    scoped: true,
  }),
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

  '/snapshot/:snapshotId': importRoute('views/pages/snapshot_proposals', {
    scoped: true,
    deferChain: true,
  }),
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
  '/:scope/chat/:channel': redirectRoute((attrs) => `/chat/${attrs.channel}`),
  '/:scope/new/discussion': redirectRoute(() => '/new/discussion'),
  '/:scope/account/:address': redirectRoute(
    (attrs) => `/account/${attrs.address}/`
  ),
  '/:scope/account': redirectRoute(() =>
    app.user.activeAccount ? `/account/${app.user.activeAccount.address}` : '/'
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
});

const getCommonDomainRoutes = (importRoute) => ({
  // Global routes
  '/': importRoute('views/pages/landing', {
    hideSidebar: false,
  }),
  '/communities': importRoute('views/pages/communities', {
    hideSidebar: false,
  }),
  '/search': importRoute('views/pages/search', {
    deferChain: true,
  }),
  '/whyCommonwealth': importRoute('views/pages/why_commonwealth', {
    hideSidebar: true,
  }),
  '/dashboard': importRoute('views/pages/user_dashboard', {
    deferChain: true,
  }),
  '/dashboard/:type': importRoute('views/pages/user_dashboard', {
    deferChain: true,
  }),
  '/web3login': importRoute('views/pages/web3login', {
    deferChain: true,
  }),

  // Scoped routes
  '/:scope/proposal/discussion/:identifier': redirectRoute(
    (attrs) => `/${attrs.scope}/discussion/${attrs.identifier}`
  ),

  // Notifications
  '/:scope/notifications': importRoute('views/pages/notifications_page', {
    scoped: true,
    deferChain: true,
  }),
  '/notifications': redirectRoute(() => '/edgeware/notifications'),
  '/notification-settings': importRoute('views/pages/notification_settings', {
    scoped: true,
    deferChain: true,
  }),

  // NEAR
  '/:scope/finishNearLogin': importRoute('views/pages/finish_near_login', {
    scoped: true,
  }),
  '/finishaxielogin': importRoute('views/pages/finish_axie_login'),

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
  '/:scope/new/contract': importRoute('views/pages/new_contract', {
    scoped: true,
    deferChain: true,
  }),
  '/:scope/contract/:contractAddress': importRoute(
    'views/pages/general_contract',
    { scoped: true }
  ),
  '/:scope/discussions/:topic': importRoute('views/pages/discussions', {
    scoped: true,
    deferChain: true,
  }),
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
    app.user.activeAccount
      ? `/${a.scope}/account/${app.user.activeAccount.address}`
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
  '/:scope/new/proposal/:type': importRoute('views/pages/new_proposal/index', {
    scoped: true,
  }),
  '/:scope/new/proposal': importRoute('views/pages/new_proposal/index', {
    scoped: true,
  }),

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
  '/login': importRoute('views/pages/login'),
  '/:scope/login': importRoute('views/pages/login', {
    scoped: true,
    deferChain: true,
  }),

  // Admin
  '/:scope/admin': importRoute('views/pages/admin', { scoped: true }),
  '/manage': importRoute('views/pages/manage_community/index'),
  '/:scope/manage': importRoute('views/pages/manage_community/index', {
    scoped: true,
  }),
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
});

const getRoutes = (customDomain: string) => {
  const importRoute = (path: string, attrs?: RouteAttrs) =>
    renderRoute(path, attrs, customDomain);

  return {
    // Sitewide pages
    '/about': importRoute('views/pages/why_commonwealth'),
    '/terms': importRoute('views/pages/terms'),
    '/privacy': importRoute('views/pages/privacy'),
    '/createCommunity': importRoute('views/pages/create_community'),
    '/components': importRoute('views/pages/components', {
      hideSidebar: true,
    }),
    ...(customDomain
      ? getCustomDomainRoutes(importRoute)
      : getCommonDomainRoutes(importRoute)),
  };
};

export {
  getRoutes,
  navigateToSubpage,
  handleLoginRedirects,
  handleInviteLinkRedirect,
};
