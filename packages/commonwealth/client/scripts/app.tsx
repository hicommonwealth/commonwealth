/* jsx jsx */

import React from 'react';
/* eslint-disable @typescript-eslint/ban-types */

import '../../static/fonts/fonts.css';
import '../styles/normalize.css'; // reset
import '../styles/tailwind_reset.css'; // for the landing page
import '../styles/shared.scss';
import 'construct.scss';
import 'lity/dist/lity.min.css';
import mixpanel from 'mixpanel-browser';

import $ from 'jquery';

import './fragment-fix';
import app, { initAppState, LoginState } from 'state';

import {
  getRoutes,
  handleInviteLinkRedirect,
  handleLoginRedirects,
} from 'router';
import momentUpdateLocale from 'helpers/momentUpdateLocale';
import injectGoogleTagManagerScript from 'helpers/injectGoogleTagManagerScript';
import handleWindowError from 'helpers/handleWindowError';
import initializeMixpanel from 'helpers/initializeMixpanel';
import showLoginNotification from 'helpers/showLoginNotification';
import handleUpdateEmailConfirmation from 'helpers/handleUpdateEmailConfirmation';

// set up ontouchmove blocker
document.ontouchmove = (event) => {
  event.preventDefault();
};

Promise.all([$.ready, $.get('/api/domain')]).then(
  async ([, { customDomain }]) => {
    handleWindowError();

    // m.route(document.body, '/', getRoutes(customDomain));

    // injectGoogleTagManagerScript();
    // initializeMixpanel();
    // handleLoginRedirects();
    // showLoginNotification();
    // momentUpdateLocale();

    // initialize the app
    // initAppState(true, customDomain)
    //   .then(async () => {
    //     if (app.loginState === LoginState.LoggedIn) {
    //       // refresh notifications once
    //       // grab all discussion drafts
    //       app.user.discussionDrafts.refreshAll().then(() => m.redraw());
    //     }
    //
    //     handleInviteLinkRedirect();
    //     // If the user updates their email
    //     handleUpdateEmailConfirmation();
    //
    //     m.redraw();
    //   })
    //   .catch(() => {
    //     m.redraw();
    //   });



    // @ZAK TODO
    // /*
    //     const isCustomDomain = !!customDomain;
    //     const { activeAccount } = app.user;
    //     const routes: {[route: string]: {
    //       onmatch?: () => Promise<any>,
    //       render: (vnode: any) => ReturnType<render>
    //     }} = {
    //       // Sitewide pages
    //       '/about': importRoute('views/pages/why_commonwealth', {
    //         scoped: false,
    //       }),
    //       '/terms': importRoute('views/pages/terms', { scoped: false }),
    //       '/privacy': importRoute('views/pages/privacy', { scoped: false }),
    //       '/components': importRoute('views/pages/components', {
    //         scoped: false,
    //         hideSidebar: true,
    //       }),
    //       '/createCommunity': importRoute('views/pages/create_community', {
    //         scoped: false,
    //       }),
    //       ...(isCustomDomain
    //         ? {
    //             //
    //             // Custom domain routes
    //             //
    //             '/': importRoute('views/pages/discussions_redirect', {
    //               scoped: true,
    //             }),
    //             '/web3login': redirectRoute(() => '/'),
    //             '/search': importRoute('views/pages/search', {
    //               scoped: false,
    //               deferChain: true,
    //             }),
    //             // Notifications
    //             '/notification-settings': importRoute(
    //               'views/pages/notification_settings',
    //               { scoped: true, deferChain: true }
    //             ),
    //             '/notifications': importRoute('views/pages/notifications', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             // NEAR
    //             '/finishNearLogin': importRoute('views/pages/finish_near_login', {
    //               scoped: true,
    //             }),
    //             '/finishaxielogin': importRoute('views/pages/finish_axie_login', {
    //               scoped: true,
    //             }),
    //             // Discussions
    //             '/home': redirectRoute((attrs) => `/${attrs.scope}/`),
    //             '/discussions': importRoute('views/pages/discussions', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/discussions/:topic': importRoute('views/pages/discussions', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/overview': importRoute('views/pages/overview', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/members': importRoute('views/pages/members', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/sputnik-daos': importRoute('views/pages/sputnikdaos', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/chat/:channel': importRoute('views/pages/chat', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/new/discussion': importRoute('views/pages/new_thread', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             // Profiles
    //             '/account/:address': importRoute('views/pages/profile', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/account': redirectRoute((a) =>
    //               activeAccount ? `/account/${activeAccount.address}` : '/'
    //             ),
    //             // Governance
    //             '/referenda': importRoute('views/pages/referenda', {
    //               scoped: true,
    //             }),
    //             '/proposals': importRoute('views/pages/proposals', {
    //               scoped: true,
    //             }),
    //             '/council': importRoute('views/pages/council', { scoped: true }),
    //             '/delegate': importRoute('views/pages/delegate', { scoped: true }),
    //             '/proposal/:type/:identifier': importRoute(
    //               'views/pages/view_proposal/index',
    //               { scoped: true }
    //             ),
    //             '/:scope/proposal/discussion/:identifier': redirectRoute(
    //               (attrs) => `/discussion/${attrs.identifier}`
    //             ),
    //             '/proposal/:identifier': importRoute(
    //               'views/pages/view_proposal/index',
    //               { scoped: true }
    //             ),
    //             '/discussion/:identifier': importRoute(
    //               'views/pages/view_thread/index',
    //               { scoped: true }
    //             ),
    //             '/new/proposal/:type': importRoute(
    //               'views/pages/new_proposal/index',
    //               { scoped: true }
    //             ),
    //             '/new/proposal': importRoute('views/pages/new_proposal/index', {
    //               scoped: true,
    //             }),
    //             // Treasury
    //             '/treasury': importRoute('views/pages/treasury', { scoped: true }),
    //             '/bounties': importRoute('views/pages/bounties', { scoped: true }),
    //             '/tips': importRoute('views/pages/tips', { scoped: true }),
    //             '/validators': importRoute('views/pages/validators', {
    //               scoped: true,
    //             }),
    //             // Settings
    //             '/login': importRoute('views/pages/login', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             // Admin
    //             '/admin': importRoute('views/pages/admin', { scoped: true }),
    //             '/manage': importRoute('views/pages/manage_community/index', {
    //               scoped: true,
    //             }),
    //             '/spec_settings': importRoute('views/pages/spec_settings', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/settings': importRoute('views/pages/settings', { scoped: true }),
    //             '/analytics': importRoute('views/pages/stats', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //
    //             '/snapshot/:snapshotId': importRoute(
    //               'views/pages/snapshot_proposals',
    //               { scoped: true, deferChain: true }
    //             ),
    //             '/multiple-snapshots': importRoute(
    //               'views/pages/view_multiple_snapshot_spaces',
    //               { scoped: true, deferChain: true }
    //             ),
    //             '/snapshot/:snapshotId/:identifier': importRoute(
    //               'views/pages/view_snapshot_proposal',
    //               { scoped: true, deferChain: true }
    //             ),
    //             '/new/snapshot/:snapshotId': importRoute(
    //               'views/pages/new_snapshot_proposal',
    //               { scoped: true, deferChain: true }
    //             ),
    //
    //             // Redirects
    //
    //             '/:scope/dashboard': redirectRoute(() => '/'),
    //             '/:scope/notifications': redirectRoute(() => '/notifications'),
    //             '/:scope/notification-settings': redirectRoute(
    //               () => '/notification-settings'
    //             ),
    //             '/:scope/overview': redirectRoute(() => '/overview'),
    //             '/:scope/projects': redirectRoute(() => '/projects'),
    //             '/:scope/backers': redirectRoute(() => '/backers'),
    //             '/:scope/collectives': redirectRoute(() => '/collectives'),
    //             '/:scope/finishNearLogin': redirectRoute(() => '/finishNearLogin'),
    //             '/:scope/finishaxielogin': redirectRoute(() => '/finishaxielogin'),
    //             '/:scope/home': redirectRoute(() => '/'),
    //             '/:scope/discussions': redirectRoute(() => '/discussions'),
    //             '/:scope': redirectRoute(() => '/'),
    //             '/:scope/discussions/:topic': redirectRoute(
    //               (attrs) => `/discussions/${attrs.topic}/`
    //             ),
    //             '/:scope/search': redirectRoute(() => '/search'),
    //             '/:scope/members': redirectRoute(() => '/members'),
    //             '/:scope/sputnik-daos': redirectRoute(() => '/sputnik-daos'),
    //             '/:scope/chat/:channel': redirectRoute(
    //               (attrs) => `/chat/${attrs.channel}`
    //             ),
    //             '/:scope/new/discussion': redirectRoute(() => '/new/discussion'),
    //             '/:scope/account/:address': redirectRoute(
    //               (attrs) => `/account/${attrs.address}/`
    //             ),
    //             '/:scope/account': redirectRoute(() =>
    //               activeAccount ? `/account/${activeAccount.address}` : '/'
    //             ),
    //             '/:scope/referenda': redirectRoute(() => '/referenda'),
    //             '/:scope/proposals': redirectRoute(() => '/proposals'),
    //             '/:scope/council': redirectRoute(() => '/council'),
    //             '/:scope/delegate': redirectRoute(() => '/delegate'),
    //             '/:scope/proposal/:type/:identifier': redirectRoute(
    //               (attrs) => `/proposal/${attrs.type}/${attrs.identifier}/`
    //             ),
    //             '/:scope/proposal/:identifier': redirectRoute(
    //               (attrs) => `/proposal/${attrs.identifier}/`
    //             ),
    //             '/:scope/discussion/:identifier': redirectRoute(
    //               (attrs) => `/discussion/${attrs.identifier}/`
    //             ),
    //             '/:scope/new/proposal/:type': redirectRoute(
    //               (attrs) => `/new/proposal/${attrs.type}/`
    //             ),
    //             '/:scope/new/proposal': redirectRoute(() => '/new/proposal'),
    //             '/:scope/treasury': redirectRoute(() => '/treasury'),
    //             '/:scope/bounties': redirectRoute(() => '/bounties'),
    //             '/:scope/tips': redirectRoute(() => '/tips'),
    //             '/:scope/validators': redirectRoute(() => '/validators'),
    //             '/:scope/login': redirectRoute(() => '/login'),
    //             '/:scope/settings': redirectRoute(() => '/settings'),
    //             '/:scope/admin': redirectRoute(() => '/admin'),
    //             '/:scope/manage': redirectRoute(() => '/manage'),
    //             '/:scope/spec_settings': redirectRoute(() => '/spec_settings'),
    //             '/:scope/analytics': redirectRoute(() => '/analytics'),
    //             '/:scope/snapshot-proposals/:snapshotId': redirectRoute(
    //               (attrs) => `/snapshot/${attrs.snapshotId}`
    //             ),
    //             '/:scope/snapshot-proposal/:snapshotId/:identifier': redirectRoute(
    //               (attrs) => `/snapshot/${attrs.snapshotId}/${attrs.identifier}`
    //             ),
    //             '/:scope/new/snapshot-proposal/:snapshotId': redirectRoute(
    //               (attrs) => `/new/snapshot/${attrs.snapshotId}`
    //             ),
    //             '/:scope/snapshot-proposals/:snapshotId/:identifier': redirectRoute(
    //               (attrs) => `/snapshot/${attrs.snapshotId}/${attrs.identifier}`
    //             ),
    //             '/:scope/new/snapshot-proposals/:snapshotId': redirectRoute(
    //               (attrs) => `/new/snapshot/${attrs.snapshotId}`
    //             ),
    //           }
    //         : {
    //             //
    //             // Global routes
    //             //
    //             '/': importRoute('views/pages/landing', {
    //               scoped: false,
    //               hideSidebar: false,
    //             }),
    //             '/communities': importRoute('views/pages/communities', {
    //               scoped: false,
    //               hideSidebar: false,
    //             }),
    //             '/search': importRoute('views/pages/search', {
    //               scoped: false,
    //               deferChain: true,
    //             }),
    //             '/whyCommonwealth': importRoute('views/pages/why_commonwealth', {
    //               scoped: false,
    //               hideSidebar: true,
    //             }),
    //             '/dashboard': importRoute('views/pages/user_dashboard', {
    //               scoped: false,
    //               deferChain: true,
    //             }),
    //             '/dashboard/:type': importRoute('views/pages/user_dashboard', {
    //               scoped: false,
    //               deferChain: true,
    //             }),
    //             '/web3login': importRoute('views/pages/web3login', {
    //               scoped: false,
    //               deferChain: true,
    //             }),
    //             // Scoped routes
    //             //
    //             '/:scope/proposal/discussion/:identifier': redirectRoute(
    //               (attrs) => `/${attrs.scope}/discussion/${attrs.identifier}`
    //             ),
    //
    //             // Notifications
    //             '/:scope/notifications': importRoute('views/pages/notifications', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/notifications': redirectRoute(() => '/edgeware/notifications'),
    //             '/notification-settings': importRoute(
    //               'views/pages/notification_settings',
    //               { scoped: true, deferChain: true }
    //             ),
    //             // NEAR
    //             '/:scope/finishNearLogin': importRoute(
    //               'views/pages/finish_near_login',
    //               { scoped: true }
    //             ),
    //             '/finishaxielogin': importRoute('views/pages/finish_axie_login', {
    //               scoped: false,
    //             }),
    //             // Settings
    //             '/settings': redirectRoute(() => '/edgeware/settings'),
    //             '/:scope/settings': importRoute('views/pages/settings', {
    //               scoped: true,
    //             }),
    //
    //             // Discussions
    //             '/home': redirectRoute('/'), // legacy redirect, here for compatibility only
    //             '/discussions': redirectRoute('/'), // legacy redirect, here for compatibility only
    //             '/:scope/home': redirectRoute((attrs) => `/${attrs.scope}/`),
    //             '/:scope': importRoute('views/pages/discussions_redirect', {
    //               scoped: true,
    //             }),
    //             '/:scope/discussions': importRoute('views/pages/discussions', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/:scope/overview': importRoute('views/pages/overview', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/:scope/discussions/:topic': importRoute(
    //               'views/pages/discussions',
    //               { scoped: true, deferChain: true }
    //             ),
    //             '/:scope/search': importRoute('views/pages/search', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/:scope/members': importRoute('views/pages/members', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/:scope/sputnik-daos': importRoute('views/pages/sputnikdaos', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/:scope/chat/:channel': importRoute('views/pages/chat', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/:scope/new/discussion': importRoute('views/pages/new_thread', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             // Profiles
    //             '/:scope/account/:address': importRoute('views/pages/profile', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/:scope/account': redirectRoute((a) =>
    //               activeAccount
    //                 ? `/${a.scope}/account/${activeAccount.address}`
    //                 : `/${a.scope}/`
    //             ),
    //             // Governance
    //             '/:scope/referenda': importRoute('views/pages/referenda', {
    //               scoped: true,
    //             }),
    //             '/:scope/proposals': importRoute('views/pages/proposals', {
    //               scoped: true,
    //             }),
    //             '/:scope/council': importRoute('views/pages/council', {
    //               scoped: true,
    //             }),
    //             '/:scope/delegate': importRoute('views/pages/delegate', {
    //               scoped: true,
    //             }),
    //             '/:scope/proposal/:type/:identifier': importRoute(
    //               'views/pages/view_proposal/index',
    //               { scoped: true }
    //             ),
    //             '/:scope/proposal/:identifier': importRoute(
    //               'views/pages/view_proposal/index',
    //               { scoped: true }
    //             ),
    //             '/:scope/discussion/:identifier': importRoute(
    //               'views/pages/view_thread/index',
    //               { scoped: true }
    //             ),
    //             '/:scope/new/proposal/:type': importRoute(
    //               'views/pages/new_proposal/index',
    //               { scoped: true }
    //             ),
    //             '/:scope/new/proposal': importRoute(
    //               'views/pages/new_proposal/index',
    //               { scoped: true }
    //             ),
    //
    //             // Treasury
    //             '/:scope/treasury': importRoute('views/pages/treasury', {
    //               scoped: true,
    //             }),
    //             '/:scope/bounties': importRoute('views/pages/bounties', {
    //               scoped: true,
    //             }),
    //             '/:scope/tips': importRoute('views/pages/tips', { scoped: true }),
    //             '/:scope/validators': importRoute('views/pages/validators', {
    //               scoped: true,
    //             }),
    //             // Settings
    //             '/login': importRoute('views/pages/login', { scoped: false }),
    //             '/:scope/login': importRoute('views/pages/login', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             // Admin
    //             '/:scope/admin': importRoute('views/pages/admin', { scoped: true }),
    //             '/manage': importRoute('views/pages/manage_community/index', {
    //               scoped: false,
    //             }),
    //             '/:scope/manage': importRoute(
    //               'views/pages/manage_community/index',
    //               { scoped: true }
    //             ),
    //             '/:scope/spec_settings': importRoute('views/pages/spec_settings', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //             '/:scope/analytics': importRoute('views/pages/stats', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //
    //             '/:scope/snapshot/:snapshotId': importRoute(
    //               'views/pages/snapshot_proposals',
    //               { scoped: true, deferChain: true }
    //             ),
    //             '/:scope/multiple-snapshots': importRoute(
    //               'views/pages/view_multiple_snapshot_spaces',
    //               { scoped: true, deferChain: true }
    //             ),
    //             '/:scope/snapshot/:snapshotId/:identifier': importRoute(
    //               'views/pages/view_snapshot_proposal',
    //               { scoped: true, deferChain: true }
    //             ),
    //             '/:scope/new/snapshot/:snapshotId': importRoute(
    //               'views/pages/new_snapshot_proposal',
    //               { scoped: true, deferChain: true }
    //             ),
    //             '/:scope/snapshot-proposals/:snapshotId': redirectRoute(
    //               (attrs) => `/${attrs.scope}/snapshot/${attrs.snapshotId}`
    //             ),
    //             '/:scope/snapshot-proposal/:snapshotId/:identifier': redirectRoute(
    //               (attrs) =>
    //                 `/${attrs.scope}/snapshot/${attrs.snapshotId}/${attrs.identifier}`
    //             ),
    //             '/:scope/new/snapshot-proposal/:snapshotId': redirectRoute(
    //               (attrs) => `/${attrs.scope}/new/snapshot/${attrs.snapshotId}`
    //             ),
    //             '/:scope/snapshot-proposals/:snapshotId/:identifier': redirectRoute(
    //               (attrs) =>
    //                 `/${attrs.scope}/snapshot/${attrs.snapshotId}/${attrs.identifier}`
    //             ),
    //             '/:scope/new/snapshot-proposals/:snapshotId': redirectRoute(
    //               (attrs) => `/${attrs.scope}/new/snapshot/${attrs.snapshotId}`
    //             ),
    //           }),
    //     };
    //
    //
    //             '/:scope/discussions': importRoute('views/pages/discussions', {
    //               scoped: true,
    //               deferChain: true,
    //             }),
    //     */
    //     // const createRouter = (initFn) => {
    //     //   console.log('creating router...');
    //     //   const LayoutComponent = (
    //     //     <Layout deferChain={true} initFn={initFn}>
    //     //       <DiscussionsPage />
    //     //     </Layout>
    //     //   );
    //     //   const reactRouter = createBrowserRouter(
    //     //     createRoutesFromElements(
    //     //       <Route path="/:scope/discussions" element={LayoutComponent} />
    //     //     )
    //     //   );
    //     // const rootElement = document.getElementById('react');
    //     // const root = createRoot(rootElement);
    //
    //     // root.render(<div>hello there</div>);
    //
    //     // createRoot(document.body).render(<RouterProvider router={reactRouter} />);
    //     // return LayoutComponent;
    //     /*
    //     const script = document.createElement('noscript');
    //     // eslint-disable-next-line max-len
    //     rootRender(
    //       script,
    //       render.trust(
    //         '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KRWH69V" height="0" width="0" style="display:none;visibility:hidden"></iframe>'
    //       )
    //     );
    //     document.body.insertBefore(script, document.body.firstChild);
    //     */
    //     // };
    //     // initialize mixpanel, before adding an alias or tracking identity
    //     /*
    //     try {
    //       if (
    //         document.location.host.startsWith('localhost') ||
    //         document.location.host.startsWith('127.0.0.1')
    //       ) {
    //         mixpanel.init(MIXPANEL_DEV_TOKEN, { debug: true });
    //       } else {
    //         // Production Mixpanel Project
    //         mixpanel.init(MIXPANEL_PROD_TOKEN, { debug: true });
    //       }
    //     } catch (e) {
    //       console.error('Mixpanel initialization error');
    //     }
    //
    //     // handle login redirects
    //     if (
    //       getRouteParam('loggedin') &&
    //       getRouteParam('loggedin').toString() === 'true' &&
    //       getRouteParam('path') &&
    //       !getRouteParam('path').startsWith('/login')
    //     ) {
    //       // (we call toString() because getRouteParam() returns booleans, even though the types don't reflect this)
    //       // handle param-based redirect after email login
    //
    //       // If we are creating a new account, then we alias to create a new mixpanel user
    //       // else we identify to associate mixpanel events
    //       if (getRouteParam('new') && getRouteParam('new').toString() === 'true') {
    //         console.log('creating account');
    //
    //         try {
    //         } catch (err) {
    //           // Don't do anything... Just identify if there is an error
    //           // mixpanel.identify(getRouteParam('email').toString());
    //         }
    //       } else {
    //       }
    //       setRoute(getRouteParam('path'), {}, { replace: true });
    //     } else if (
    //       localStorage &&
    //       localStorage.getItem &&
    //       localStorage.getItem('githubPostAuthRedirect')
    //     ) {
    //       // handle localStorage-based redirect after Github login (callback must occur within 30 seconds)
    //       try {
    //         const postAuth = JSON.parse(
    //           localStorage.getItem('githubPostAuthRedirect')
    //         );
    //         if (postAuth.path && +new Date() - postAuth.timestamp < 30 * 1000) {
    //           setRoute(postAuth.path, {}, { replace: true });
    //         }
    //         localStorage.removeItem('githubPostAuthRedirect');
    //       } catch (e) {
    //         console.log('Error restoring path from localStorage');
    //       }
    //     } else if (
    //       localStorage &&
    //       localStorage.getItem &&
    //       localStorage.getItem('discordPostAuthRedirect')
    //     ) {
    //       try {
    //         const postAuth = JSON.parse(
    //           localStorage.getItem('discordPostAuthRedirect')
    //         );
    //         if (postAuth.path && +new Date() - postAuth.timestamp < 30 * 1000) {
    //           setRoute(postAuth.path, {}, { replace: true });
    //         }
    //         localStorage.removeItem('discordPostAuthRedirect');
    //       } catch (e) {
    //         console.log('Error restoring path from localStorage');
    //       }
    //     }
    //     if (getRouteParam('loggedin')) {
    //       notifySuccess('Logged in!');
    //     } else if (getRouteParam('loginerror')) {
    //       notifyError('Could not log in');
    //       console.error(getRouteParam('loginerror'));
    //     }
    //     */
    //
    //     // initialize the app
    //     // createRouter(async () => {
    //     //   return initAppState(true, customDomain);
    //     // });
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
