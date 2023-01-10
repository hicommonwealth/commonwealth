import React, { useEffect } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import { Layout } from 'views/layout';
import { initAppState } from 'app';
import DiscussionsPage from 'views/pages/discussions';
import WhyCommonwealthPage from 'views/pages/why_commonwealth';
import { PageNotFound } from 'views/pages/404';
import MembersPage from './views/pages/members';

// TODO: This file is POC for now but this hook below and components should be placed in separate file
const useInitApp = () => {
  const [loading, setLoading] = React.useState(false);
  const [customDomain, setCustomDomain] = React.useState();

  useEffect(() => {
    setLoading(true);
    fetch('/api/domain')
      .then((res) => res.json())
      .then(({ domain }) => setCustomDomain(domain))
      .then(() => initAppState(true, customDomain))
      .catch((err) => console.log('Failed fetching custom domain', err))
      .finally(() => setLoading(false));
  }, []);

  return { loading, customDomain };
};

const withLayout = (Component, params) => {
  return <Layout params={params}><Component /></Layout>;
};

const App = () => {
  useInitApp();

  /*
  
            '/': importRoute('views/pages/landing', {
              scoped: false,
              hideSidebar: false,
            }),
            '/communities': importRoute('views/pages/communities', {
              scoped: false,
              hideSidebar: false,
            }),
            '/search': importRoute('views/pages/search', {
              scoped: false,
              deferChain: true,
            }),
            '/whyCommonwealth': importRoute('views/pages/why_commonwealth', {
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
            '/:scope/proposal/discussion/:identifier': redirectRoute(
              (attrs) => `/${attrs.scope}/discussion/${attrs.identifier}`
            ),

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
 */

  // TODO: use loader to avoid immediately importing all pages
  return (
    <Routes>
      <Route path="/whyCommonwealth" element={
        withLayout(WhyCommonwealthPage, { scoped: false, hideSidebar: true })
      } />
      <Route
        path="/:scope/discussions"
        element={
          withLayout(DiscussionsPage, { scoped: true, deferChain: true })
        }
      />
      <Route
        path="/:scope/members"
        element={
          withLayout(MembersPage, { scoped: true, deferChain: true })
        }
      />
      <Route path="*" element={withLayout(PageNotFound, { scoped: false })} />
    </Routes>
  );
};

const rootElement = document.getElementById('root');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

declare const module: any; // tslint:disable-line no-reserved-keywords
if (module.hot) {
  module.hot.accept();
}
