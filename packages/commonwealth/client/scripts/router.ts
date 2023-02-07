import { alertModalWithText } from 'views/modals/alert_modal';
import app from 'state';
import { ChainType } from 'common-common/src/types';
import { Layout } from 'views/layout';
import {
  APPLICATION_UPDATE_ACTION,
  APPLICATION_UPDATE_MESSAGE,
} from 'helpers/constants';
import { getRoute, getRouteParam, setRoute, render } from 'mithrilInterop';

export const pathIsDiscussion = (
  scope: string | null,
  path: string
): boolean => {
  return (
    path.startsWith(`/${scope}/discussion`) || path.startsWith('/discussion')
  );
};

/**
  TODO THIS FILE IS DEPRECATED BUT NOT ALL FUNCTIONALITIES HAVE BEEN REWRITTEN TO THE REACT APPROACH
  SO THIS SHOULD STAY HERE TILL EVERYTHING WILL BE TRANSFERRED.
  TRANSFERRED CHUNKS ARE COMMENTED OUT.
  !!! IF YOU WANT TO ADD NEW ROUTE, CHECK "navigation/AppNavigator.tsx" !!!
**/

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

const _onpopstate = window.onpopstate;
window.onpopstate = (...args) => {
  app._lastNavigatedBack = true;
  app._lastNavigatedFrom = getRoute();

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
  // app.sidebarRedraw.emit('redraw');
  setRoute.apply(this, args);
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
    setRoute(
      typeof path === 'string' ? path : path(vnode.attrs),
      {},
      { replace: true }
    );

    return render(Layout);
  },
});

const handleLoginRedirects = () => {
  const routeParam = getRouteParam();
  if (
    routeParam['loggedin'] &&
    routeParam['loggedin'].toString() === 'true' &&
    routeParam['path'] &&
    !routeParam['path'].startsWith('/login')
  ) {
    // (we call toString() because m.route.param() returns booleans, even though the types don't reflect this)
    // handle param-based redirect after email login

    /* If we are creating a new account, then we alias to create a new mixpanel user
     else we identify to associate mixpanel events
    */
    if (
      getRouteParam()['new'] &&
      getRouteParam()['new'].toString() === 'true'
    ) {
      console.log('creating account');
    }

    setRoute(getRouteParam['path'], {}, { replace: true });
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
        setRoute(postAuth.path, {}, { replace: true });
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
        setRoute(postAuth.path, {}, { replace: true });
      }
      localStorage.removeItem('discordPostAuthRedirect');
    } catch (e) {
      console.log('Error restoring path from localStorage');
    }
  }
};

let hasCompletedSuccessfulPageLoad = false;

const renderRoute = (
  importPromise,
  attrs: RouteAttrs,
  customDomain: string
) => ({
  onmatch: async () => {
    return importPromise
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
      path: importPromise.moduleName,
    });

    return render(Layout, { scope, deferChain, hideSidebar }, [vnode]);
  },
});

const getCustomDomainRoutes = (importRoute) => ({
  // Custom domain routes
  '/': importRoute(import('views/pages/discussions_redirect'), {
    scoped: true,
  }),
  '/web3login': redirectRoute(() => '/'),
  '/search': importRoute(import('views/pages/search'), {
    deferChain: true,
  }),

  // Notifications
  '/notification-settings': importRoute(
    import('views/pages/notification_settings'),
    {
      scoped: true,
      deferChain: true,
    }
  ),
  '/notifications': importRoute(import('views/pages/notifications'), {
    scoped: true,
    deferChain: true,
  }),

  // NEAR
  '/finishNearLogin': importRoute(import('views/pages/finish_near_login'), {
    scoped: true,
  }),
  '/finishaxielogin': importRoute(import('views/pages/finish_axie_login'), {
    scoped: true,
  }),

  // General Contracts
  '/new/contract': importRoute(import('views/pages/new_contract'), {
    scoped: true,
    deferChain: true,
  }),
  '/contract/:contractAddress': importRoute(
    import('views/pages/general_contract'),
    {
      scoped: true,
    }
  ),

  // Discussions
  '/home': redirectRoute((attrs) => `/${attrs.scope}/`),
  '/discussions': importRoute(import('views/pages/discussions'), {
    scoped: true,
    deferChain: true,
  }),
  '/discussions/:topic': importRoute(import('views/pages/discussions'), {
    scoped: true,
    deferChain: true,
  }),
  '/overview': importRoute(import('views/pages/overview'), {
    scoped: true,
    deferChain: true,
  }),
  '/members': importRoute(import('views/pages/members'), {
    scoped: true,
    deferChain: true,
  }),
  '/sputnik-daos': importRoute(import('views/pages/sputnikdaos'), {
    scoped: true,
    deferChain: true,
  }),
  '/chat/:channel': importRoute(import('views/pages/chat'), {
    scoped: true,
    deferChain: true,
  }),
  '/new/discussion': importRoute(import('views/pages/new_thread'), {
    scoped: true,
    deferChain: true,
  }),

  // Profiles
  '/account/:address': importRoute(import('views/pages/profile'), {
    scoped: true,
    deferChain: true,
  }),
  '/account': redirectRoute(() =>
    app.user.activeAccount ? `/account/${app.user.activeAccount.address}` : '/'
  ),

  // Governance
  '/referenda': importRoute(import('views/pages/referenda'), {
    scoped: true,
  }),
  '/proposals': importRoute(import('views/pages/proposals'), {
    scoped: true,
  }),
  '/council': importRoute(import('views/pages/council'), { scoped: true }),
  '/delegate': importRoute(import('views/pages/delegate'), { scoped: true }),
  '/proposal/:type/:identifier': importRoute(
    import('views/pages/view_proposal/index'),
    { scoped: true }
  ),
  '/:scope/proposal/discussion/:identifier': redirectRoute(
    (attrs) => `/discussion/${attrs.identifier}`
  ),
  '/proposal/:identifier': importRoute(
    import('views/pages/view_proposal/index'),
    {
      scoped: true,
    }
  ),
  '/discussion/:identifier': importRoute(
    import('views/pages/view_thread/index'),
    {
      scoped: true,
    }
  ),
  '/new/proposal/:type': importRoute(import('views/pages/new_proposal/index'), {
    scoped: true,
  }),
  '/new/proposal': importRoute(import('views/pages/new_proposal/index'), {
    scoped: true,
  }),

  // Treasury
  '/treasury': importRoute(import('views/pages/treasury'), { scoped: true }),
  '/bounties': importRoute(import('views/pages/bounties'), { scoped: true }),
  '/tips': importRoute(import('views/pages/tips'), { scoped: true }),
  '/validators': importRoute(import('views/pages/validators'), {
    scoped: true,
  }),

  // Admin
  '/admin': importRoute(import('views/pages/admin'), { scoped: true }),
  '/manage': importRoute(import('views/pages/manage_community/index'), {
    scoped: true,
  }),
  '/spec_settings': importRoute(import('views/pages/spec_settings'), {
    scoped: true,
    deferChain: true,
  }),
  '/settings': importRoute(import('views/pages/settings'), { scoped: true }),
  '/analytics': importRoute(import('views/pages/stats'), {
    scoped: true,
    deferChain: true,
  }),

  '/snapshot/:snapshotId': importRoute(
    import('views/pages/snapshot_proposals'),
    {
      scoped: true,
      deferChain: true,
    }
  ),
  '/multiple-snapshots': importRoute(
    import('views/pages/view_multiple_snapshot_spaces'),
    { scoped: true, deferChain: true }
  ),
  '/snapshot/:snapshotId/:identifier': importRoute(
    import('views/pages/view_snapshot_proposal'),
    { scoped: true, deferChain: true }
  ),
  '/new/snapshot/:snapshotId': importRoute(
    import('views/pages/new_snapshot_proposal'),
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
  // '/': importRoute(import('views/pages/landing'), {
  //   hideSidebar: false,
  // }),
  // '/communities': importRoute(import('views/pages/communities'), {
  //   hideSidebar: false,
  // }),
  // '/search': importRoute(import('views/pages/search'), {
  //   deferChain: true,
  // }),
  // '/whyCommonwealth': importRoute(import('views/pages/why_commonwealth'), {
  //   hideSidebar: true,
  // }),
  // '/dashboard': importRoute(import('views/pages/user_dashboard'), {
  //   deferChain: true,
  // }),
  // '/dashboard/:type': importRoute(import('views/pages/user_dashboard'), {
  //   deferChain: true,
  // }),
  // '/web3login': importRoute(import('views/pages/web3login'), {
  //   deferChain: true,
  // }),
  // Scoped routes
  // '/:scope/proposal/discussion/:identifier': redirectRoute(
  //   (attrs) => `/${attrs.scope}/discussion/${attrs.identifier}`
  // ),
  // Notifications
  // '/:scope/notifications': importRoute(import('views/pages/notifications'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/notifications': redirectRoute(() => '/edgeware/notifications'),
  // '/notification-settings': importRoute(
  //   import('views/pages/notification_settings'),
  //   {
  //     scoped: true,
  //     deferChain: true,
  //   }
  // ),
  // NEAR
  // '/:scope/finishNearLogin': importRoute(
  //   import('views/pages/finish_near_login'),
  //   {
  //     scoped: true,
  //   }
  // ),
  // '/finishaxielogin': importRoute(import('views/pages/finish_axie_login')),
  // Settings
  // '/settings': redirectRoute(() => '/edgeware/settings'),
  // '/:scope/settings': importRoute(import('views/pages/settings'), {
  //   scoped: true,
  // }),
  // Discussions
  // '/home': redirectRoute('/'), // legacy redirect, here for compatibility only
  // '/discussions': redirectRoute('/'), // legacy redirect, here for compatibility only
  // '/:scope/home': redirectRoute((attrs) => `/${attrs.scope}/`),
  // '/:scope': importRoute(import('views/pages/discussions_redirect'), {
  //   scoped: true,
  // }),
  // '/:scope/discussions': importRoute(import('views/pages/discussions'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/overview': importRoute(import('views/pages/overview'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/new/contract': importRoute(import('views/pages/new_contract'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/contract/:contractAddress': importRoute(
  //   'views/pages/general_contract',
  //   { scoped: true }
  // ),
  // '/:scope/discussions/:topic': importRoute(import('views/pages/discussions'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/search': importRoute(import('views/pages/search'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/members': importRoute(import('views/pages/members'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/sputnik-daos': importRoute(import('views/pages/sputnikdaos'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/chat/:channel': importRoute(import('views/pages/chat'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/new/discussion': importRoute(import('views/pages/new_thread'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // Profiles
  // '/:scope/account/:address': importRoute(import('views/pages/profile'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/account': redirectRoute((a) =>
  //   app.user.activeAccount
  //     ? `/${a.scope}/account/${app.user.activeAccount.address}`
  //     : `/${a.scope}/`
  // ),
  // Governance
  // '/:scope/referenda': importRoute(import('views/pages/referenda'), {
  //   scoped: true,
  // }),
  // '/:scope/proposals': importRoute(import('views/pages/proposals'), {
  //   scoped: true,
  // }),
  // '/:scope/council': importRoute(import('views/pages/council'), {
  //   scoped: true,
  // }),
  // '/:scope/delegate': importRoute(import('views/pages/delegate'), {
  //   scoped: true,
  // }),
  // '/:scope/proposal/:type/:identifier': importRoute(
  //   'views/pages/view_proposal/index',
  //   { scoped: true }
  // ),
  // '/:scope/proposal/:identifier': importRoute(
  //   'views/pages/view_proposal/index',
  //   { scoped: true }
  // ),
  // '/:scope/discussion/:identifier': importRoute(
  //   'views/pages/view_thread/index',
  //   { scoped: true }
  // ),
  // '/:scope/new/proposal/:type': importRoute(
  //   import('views/pages/new_proposal/index'),
  //   {
  //     scoped: true,
  //   }
  // ),
  // '/:scope/new/proposal': importRoute(
  //   import('views/pages/new_proposal/index'),
  //   {
  //     scoped: true,
  //   }
  // ),
  // Treasury
  // '/:scope/treasury': importRoute(import('views/pages/treasury'), {
  //   scoped: true,
  // }),
  // '/:scope/bounties': importRoute(import('views/pages/bounties'), {
  //   scoped: true,
  // }),
  // '/:scope/tips': importRoute(import('views/pages/tips'), { scoped: true }),
  // '/:scope/validators': importRoute(import('views/pages/validators'), {
  //   scoped: true,
  // }),
  // Admin
  // '/:scope/admin': importRoute(import('views/pages/admin'), { scoped: true }),
  // '/manage': importRoute(import('views/pages/manage_community/index')),
  // '/:scope/manage': importRoute(import('views/pages/manage_community/index'), {
  //   scoped: true,
  // }),
  // '/:scope/spec_settings': importRoute(import('views/pages/spec_settings'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/analytics': importRoute(import('views/pages/stats'), {
  //   scoped: true,
  //   deferChain: true,
  // }),
  // '/:scope/snapshot/:snapshotId': importRoute(
  //   'views/pages/snapshot_proposals',
  //   { scoped: true, deferChain: true }
  // ),
  // '/:scope/multiple-snapshots': importRoute(
  //   'views/pages/view_multiple_snapshot_spaces',
  //   { scoped: true, deferChain: true }
  // ),
  // '/:scope/snapshot/:snapshotId/:identifier': importRoute(
  //   'views/pages/view_snapshot_proposal',
  //   { scoped: true, deferChain: true }
  // ),
  // '/:scope/new/snapshot/:snapshotId': importRoute(
  //   'views/pages/new_snapshot_proposal',
  //   { scoped: true, deferChain: true }
  // ),
  // '/:scope/snapshot-proposals/:snapshotId': redirectRoute(
  //   (attrs) => `/${attrs.scope}/snapshot/${attrs.snapshotId}`
  // ),
  // '/:scope/snapshot-proposal/:snapshotId/:identifier': redirectRoute(
  //   (attrs) =>
  //     `/${attrs.scope}/snapshot/${attrs.snapshotId}/${attrs.identifier}`
  // ),
  // '/:scope/new/snapshot-proposal/:snapshotId': redirectRoute(
  //   (attrs) => `/${attrs.scope}/new/snapshot/${attrs.snapshotId}`
  // ),
  // '/:scope/snapshot-proposals/:snapshotId/:identifier': redirectRoute(
  //   (attrs) =>
  //     `/${attrs.scope}/snapshot/${attrs.snapshotId}/${attrs.identifier}`
  // ),
  // '/:scope/new/snapshot-proposals/:snapshotId': redirectRoute(
  //   (attrs) => `/${attrs.scope}/new/snapshot/${attrs.snapshotId}`
  // ),
});

const getRoutes = (customDomain: string) => {
  const importRoute = (importPromise, attrs?: RouteAttrs) =>
    renderRoute(importPromise, attrs, customDomain);

  return {
    // Sitewide pages
    '/about': importRoute(import('views/pages/why_commonwealth')),
    '/terms': importRoute(import('views/pages/terms')),
    '/privacy': importRoute(import('views/pages/privacy')),
    '/createCommunity': importRoute(import('views/pages/create_community')),
    '/components': importRoute(import('views/pages/components'), {
      hideSidebar: true,
    }),
    ...(customDomain
      ? getCustomDomainRoutes(importRoute)
      : getCommonDomainRoutes(importRoute)),
  };
};

export { getRoutes, navigateToSubpage, handleLoginRedirects };
