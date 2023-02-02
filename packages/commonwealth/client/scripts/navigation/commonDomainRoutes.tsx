import { jsx } from 'mithrilInterop';
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { Navigate, withLayout } from 'navigation/helpers';

const WhyCommonwealthPage = lazy(() => import('views/pages/why_commonwealth'));
const DashboardPage = lazy(() => import('views/pages/user_dashboard'));
const CommunitiesPage = lazy(() => import('views/pages/communities'));
const SearchPage = lazy(() => import('views/pages/search'));
const Web3LoginPage = lazy(() => import('views/pages/web3login'));
const NotificationsPage = lazy(() => import('views/pages/notifications'));
const NotificationSettingsPage = lazy(
  () => import('views/pages/notification_settings')
);
const DiscussionsPage = lazy(() => import('views/pages/discussions'));
const SettingsPage = lazy(() => import('views/pages/settings'));
const ReferendaPage = lazy(() => import('views/pages/referenda'));
const ProposalsPage = lazy(() => import('views/pages/proposals'));
const CouncilPage = lazy(() => import('views/pages/council'));
const DelegatePage = lazy(() => import('views/pages/delegate'));
const ViewProposalPage = lazy(() => import('views/pages/view_proposal/index'));
const ViewThreadPage = lazy(() => import('views/pages/view_thread/index'));
const NewProposalPage = lazy(() => import('views/pages/new_proposal/index'));

const getCommonDomainsRoutes = () => (
  <React.Fragment>
    <Route
      path="/whyCommonwealth"
      element={withLayout(WhyCommonwealthPage, { hideSidebar: true })}
    />

    <Route
      path="/dashboard"
      element={withLayout(DashboardPage, {
        deferChain: true,
      })}
    >
      <Route
        path=":type"
        element={withLayout(DashboardPage, {
          deferChain: true,
        })}
      />
    </Route>

    <Route
      path="/communities"
      element={withLayout(CommunitiesPage, {
        hideSidebar: false,
      })}
    />
    <Route
      path="/search"
      element={withLayout(SearchPage, {
        deferChain: true,
      })}
    />
    <Route
      path="/web3login"
      element={withLayout(Web3LoginPage, {
        deferChain: true,
      })}
    />

    {/*scoped */}

    {/* NOTIFICATIONS */}
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

    <Route
      path="/notifications"
      element={<Navigate to={'/edgeware/notifications'} />}
    />
    {/* NOTIFICATIONS END*/}

    {/* GOVERNANCE */}
    <Route
      path="/:scope/proposal/discussion/:identifier"
      element={<Navigate to={'/edgeware/notifications'} />}
    />

    <Route
      path="/:scope/referenda"
      element={withLayout(ReferendaPage, {
        scoped: true,
      })}
    />
    <Route
      path="/:scope/proposals"
      element={withLayout(ProposalsPage, {
        scoped: true,
      })}
    />
    <Route
      path="/:scope/council"
      element={withLayout(CouncilPage, {
        scoped: true,
      })}
    />
    <Route
      path="/:scope/delegate"
      element={withLayout(DelegatePage, {
        scoped: true,
      })}
    />
    <Route
      path="/:scope/proposal/:type/:identifier"
      element={withLayout(ViewProposalPage, {
        scoped: true,
      })}
    />
    <Route
      path="/:scope/proposal/:identifier"
      element={withLayout(ViewProposalPage, {
        scoped: true,
      })}
    />
    <Route
      path="/:scope/discussion/:identifier"
      element={withLayout(ViewThreadPage, {
        scoped: true,
      })}
    />
    <Route
      path="/:scope/new/proposal/:type"
      element={withLayout(NewProposalPage, {
        scoped: true,
      })}
    />
    <Route
      path="/:scope/new/proposal"
      element={withLayout(NewProposalPage, {
        scoped: true,
        deferChain: true,
      })}
    />

    {/* GOVERNANCE END*/}

    {/* DISCUSSIONS */}
    <Route
      path="/:scope/discussions"
      element={withLayout(DiscussionsPage, {
        scoped: true,
        deferChain: true,
      })}
    />

    <Route
      path="/:scope/discussions/:topic"
      element={withLayout(DiscussionsPage, {
        scoped: true,
        deferChain: true,
      })}
    />

    <Route
      path="/:scope/proposal/discussion/:identifier"
      element={
        <Navigate
          to={(parameters) =>
            `/${parameters.scope}/discussion/${parameters.identifier}`
          }
        />
      }
    />

    <Route
      // legacy redirect, here for compatibility only
      path="/discussions"
      element={<Navigate to="/" />}
    />
    {/* DISCUSSIONS END*/}

    {/* SETTINGS */}
    <Route
      path="/:scope/settings"
      element={withLayout(SettingsPage, {
        scoped: true,
      })}
    />
    <Route path="/settings" element={<Navigate to="/edgeware/settings" />} />
    {/* SETTINGS END*/}

    {/*// COMMON DOMAINS END*/}
  </React.Fragment>
);

export default getCommonDomainsRoutes;
