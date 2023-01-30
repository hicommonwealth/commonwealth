import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, BrowserRouter, useParams } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import { Layout } from 'views/layout';

import { PageLoading } from './views/pages/loading';
import { initAppState } from 'state';

const LandingPage = lazy(() => import('./views/pages/landing'));
const CommunitiesPage = lazy(() => import('./views/pages/communities'));
const SearchPage = lazy(() => import('./views/pages/search'));
const UserDashboard = lazy(() => import('./views/pages/user_dashboard'));
const Web3LoginPage = lazy(() => import('./views/pages/web3login'));
const NotificationsPage = lazy(() => import('./views/pages/notifications'));
const NotificationSettingsPage = lazy(
  () => import('./views/pages/notification_settings')
);
// @REACT @TODO cleanup these routes by removing explicit state variable
// const FinishNearLogin = lazy(() => import('./views/pages/finish_near_login'));
// const FinishAxieLogin = lazy(() => import('./views/pages/finish_axie_login'));
const SettingsPage = lazy(() => import('./views/pages/settings'));
const DiscussionsRedirect = lazy(
  () => import('./views/pages/discussions_redirect')
);
const OverviewPage = lazy(() => import('./views/pages/overview'));
const SputnikDAOsPage = lazy(() => import('./views/pages/sputnikdaos'));
const ChatPage = lazy(() => import('./views/pages/chat'));
const NewThreadPage = lazy(() => import('./views/pages/new_thread'));
const ProfilePage = lazy(() => import('./views/pages/profile'));
const ReferendaPage = lazy(() => import('./views/pages/referenda'));
const ProposalsPage = lazy(() => import('./views/pages/proposals'));
const CouncilPage = lazy(() => import('./views/pages/council'));
const DelegatePage = lazy(() => import('./views/pages/delegate'));
const ViewProposalPage = lazy(() => import('./views/pages/view_proposal'));
const NewProposalPage = lazy(() => import('./views/pages/new_proposal'));
const TreasuryPage = lazy(() => import('./views/pages/treasury'));
const BountiesPage = lazy(() => import('./views/pages/bounties'));
const TipsPage = lazy(() => import('./views/pages/tips'));
const ValidatorsPage = lazy(() => import('./views/pages/validators'));
const AdminPage = lazy(() => import('./views/pages/admin'));
const ManageCommunityPage = lazy(
  () => import('./views/pages/manage_community')
);
const SpecSettingsPage = lazy(() => import('./views/pages/spec_settings'));
const StatsPage = lazy(() => import('./views/pages/stats'));
const SnapshotProposalsPage = lazy(
  () => import('./views/pages/snapshot_proposals')
);
const MultipleSnapshotsPage = lazy(
  () => import('./views/pages/view_multiple_snapshot_spaces')
);
const NewSnapshotProposalPage = lazy(
  () => import('./views/pages/new_snapshot_proposal')
);
const ViewSnapshotProposalPage = lazy(
  () => import('./views/pages/view_snapshot_proposal')
);

const DiscussionsPage = lazy(() => import('views/pages/discussions'));
const WhyCommonwealthPage = lazy(() => import('views/pages/why_commonwealth'));
const ComponentsPage = lazy(() => import('views/pages/components'));
const PageNotFound = lazy(() => import('views/pages/404'));
const MembersPage = lazy(() => import('views/pages/members'));
const ViewThreadPage = lazy(() => import('views/pages/view_thread'));

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

const LayoutWrapper = ({ Component, params }) => {
  const routerParams = useParams();
  return (
    <Layout params={Object.assign(params, routerParams)}>
      <Component {...routerParams} />
    </Layout>
  );
};

const withLayout = (Component, params) => {
  return <LayoutWrapper Component={Component} params={params} />;
};

const App = () => {
  useInitApp();

  // @REACT @TODO add redirect routes + custom domain logic
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route
          path="/"
          element={withLayout(LandingPage, {
            scoped: false,
            hideSidebar: false,
          })}
        />
        <Route
          path="/communities"
          element={withLayout(CommunitiesPage, {
            scoped: false,
            hideSidebar: false,
          })}
        />
        <Route
          path="/search"
          element={withLayout(SearchPage, { scoped: false, deferChain: true })}
        />
        <Route
          path="/whyCommonwealth"
          element={withLayout(WhyCommonwealthPage, {
            scoped: false,
            hideSidebar: true,
          })}
        />
        <Route
          path="/components"
          element={withLayout(ComponentsPage, {
            scoped: false,
            hideSidebar: true,
          })}
        />
        <Route
          path="/dashboard"
          element={withLayout(UserDashboard, {
            scoped: false,
            deferChain: true,
          })}
        />
        <Route
          path="/dashboard/:type"
          element={withLayout(UserDashboard, {
            scoped: false,
            deferChain: true,
          })}
        />
        <Route
          path="/web3login"
          element={withLayout(Web3LoginPage, {
            scoped: false,
            deferChain: true,
          })}
        />
        <Route
          path="/:scope/notifications"
          element={withLayout(NotificationsPage, {
            scoped: true,
            deferChain: true,
          })}
        />
        <Route
          path="/notification-settings"
          element={withLayout(NotificationSettingsPage, {
            scoped: true,
            deferChain: true,
          })}
        />
        {/*
        <Route path="/:scope/finishNearLogin" element={
          withLayout(FinishNearLogin, { scoped: true })
        } />
        <Route path="/finishaxielogin" element={
          withLayout(FinishAxieLogin, { scoped: false })
        } />
        */}
        <Route
          path="/:scope/settings"
          element={withLayout(SettingsPage, { scoped: true })}
        />
        <Route
          path="/:scope"
          element={withLayout(DiscussionsRedirect, { scoped: true })}
        />
        <Route
          path="/:scope/discussions"
          element={withLayout(DiscussionsPage, {
            scoped: true,
            deferChain: true,
          })}
        />
        <Route
          path="/:scope/overview"
          element={withLayout(OverviewPage, { scoped: true, deferChain: true })}
        />
        <Route
          path="/:scope/discussions/:topic"
          element={withLayout(DiscussionsPage, {
            scoped: true,
            deferChain: true,
          })}
        />
        <Route
          path="/:scope/search"
          element={withLayout(SearchPage, { scoped: true, deferChain: true })}
        />
        <Route
          path="/:scope/members"
          element={withLayout(MembersPage, { scoped: true, deferChain: true })}
        />
        <Route
          path="/:scope/sputnik-daos"
          element={withLayout(SputnikDAOsPage, {
            scoped: true,
            deferChain: true,
          })}
        />
        <Route
          path="/:scope/chat/:channel"
          element={withLayout(ChatPage, { scoped: true, deferChain: true })}
        />
        <Route
          path="/:scope/new/discussion"
          element={withLayout(NewThreadPage, {
            scoped: true,
            deferChain: true,
          })}
        />
        <Route
          path="/:scope/account/:address"
          element={withLayout(ProfilePage, { scoped: true, deferChain: true })}
        />
        <Route
          path="/:scope/referenda"
          element={withLayout(ReferendaPage, { scoped: true })}
        />
        <Route
          path="/:scope/proposals"
          element={withLayout(ProposalsPage, { scoped: true })}
        />
        <Route
          path="/:scope/council"
          element={withLayout(CouncilPage, { scoped: true })}
        />
        <Route
          path="/:scope/delegate"
          element={withLayout(DelegatePage, { scoped: true })}
        />
        <Route
          path="/:scope/proposal/:type/:identifier"
          element={withLayout(ViewProposalPage, { scoped: true })}
        />
        <Route
          path="/:scope/proposal/:identifier"
          element={withLayout(ViewProposalPage, { scoped: true })}
        />
        <Route
          path="/:scope/discussion/:identifier"
          element={withLayout(ViewThreadPage, { scoped: true })}
        />
        <Route
          path="/:scope/new/proposal/:type"
          element={withLayout(NewProposalPage, { scoped: true })}
        />
        <Route
          path="/:scope/new/proposal"
          element={withLayout(NewProposalPage, { scoped: true })}
        />
        <Route
          path="/:scope/treasury"
          element={withLayout(TreasuryPage, { scoped: true })}
        />
        <Route
          path="/:scope/bounties"
          element={withLayout(BountiesPage, { scoped: true })}
        />
        <Route
          path="/:scope/tips"
          element={withLayout(TipsPage, { scoped: true })}
        />
        <Route
          path="/:scope/validators"
          element={withLayout(ValidatorsPage, { scoped: true })}
        />
        <Route
          path="/:scope/admin"
          element={withLayout(AdminPage, { scoped: true })}
        />
        <Route
          path="/:scope/manage"
          element={withLayout(ManageCommunityPage, { scoped: true })}
        />
        <Route
          path="/:scope/spec_settings"
          element={withLayout(SpecSettingsPage, { scoped: true })}
        />
        <Route
          path="/:scope/analytics"
          element={withLayout(StatsPage, { scoped: true })}
        />
        <Route
          path="/:scope/snapshot/:snapshotId"
          element={withLayout(SnapshotProposalsPage, { scoped: true })}
        />
        <Route
          path="/:scope/multiple-snapshots"
          element={withLayout(MultipleSnapshotsPage, { scoped: true })}
        />
        <Route
          path="/:scope/snapshot/:snapshotId/:identifier"
          element={withLayout(ViewSnapshotProposalPage, { scoped: true })}
        />
        <Route
          path="/:scope/new/snapshot/:snapshotId"
          element={withLayout(NewSnapshotProposalPage, { scoped: true })}
        />
        <Route path="*" element={withLayout(PageNotFound, { scoped: false })} />
      </Routes>
    </Suspense>
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
