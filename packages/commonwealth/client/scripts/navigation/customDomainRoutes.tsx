import { Route } from 'react-router-dom';
import React, { lazy } from 'react';

import { withLayout } from 'views/layout';
import { Navigate } from 'navigation/helpers';

const SearchPage = lazy(() => import('views/pages/search'));

const OverviewPage = lazy(() => import('views/pages/overview'));
const MembersPage = lazy(() => import('views/pages/members'));
const SputnikDaosPage = lazy(() => import('views/pages/sputnikdaos'));
const FinishNearLoginPage = lazy(() => import('views/pages/finish_near_login'));
const FinishAxieLoginPage = lazy(() => import('views/pages/finish_axie_login'));

const NotificationsPage = lazy(() => import('views/pages/notifications'));
const NotificationSettingsPage = lazy(
  () => import('views/pages/notification_settings')
);

const ReferendaPage = lazy(() => import('views/pages/referenda'));
const ProposalsPage = lazy(() => import('views/pages/proposals'));
const ViewProposalPage = lazy(() => import('views/pages/view_proposal/index'));
const NewProposalPage = lazy(() => import('views/pages/new_proposal/index'));

const DiscussionsPage = lazy(
  () => import('views/pages/discussions/DiscussionsPage')
);
const ViewThreadPage = lazy(() => import('views/pages/view_thread/index'));
const NewThreadPage = lazy(() => import('views/pages/new_thread'));
const DiscussionsRedirectPage = lazy(
  () => import('views/pages/discussions_redirect')
);

const NewContractPage = lazy(() => import('views/pages/new_contract'));
const GeneralContractPage = lazy(() => import('views/pages/general_contract'));

const TreasuryPage = lazy(() => import('views/pages/treasury'));
const TipsPage = lazy(() => import('views/pages/tips'));

const ManageCommunityPage = lazy(
  () => import('views/pages/manage_community/ManageCommunityPage')
);
const AnalyticsPage = lazy(() => import('views/pages/stats'));
const SnapshotProposalPage = lazy(
  () => import('views/pages/snapshot_proposals')
);
const ViewMultipleSnapshotsPage = lazy(
  () => import('views/pages/view_multiple_snapshot_spaces')
);
const ViewSnapshotsProposalPage = lazy(
  () => import('views/pages/view_snapshot_proposal')
);
const NewSnapshotProposalPage = lazy(
  () => import('views/pages/new_snapshot_proposal')
);

const NewProfilePage = lazy(() => import('views/pages/new_profile'));
const EditNewProfilePage = lazy(() => import('views/pages/edit_new_profile'));
const ProfilePageRedirect = lazy(() => import('views/pages/profile_redirect'));

const customDomainRoutes = () => {
  return [
    <Route
      path="/"
      element={withLayout(DiscussionsRedirectPage, { hideSidebar: true })}
    />,
    <Route path="/home" element={<Navigate to="/overview" />} />,
    <Route
      path="/search"
      element={withLayout(SearchPage, { deferChain: true })}
    />,
    <Route path="/web3login" element={<Navigate to="/" />} />,
    <Route
      path="/overview"
      element={withLayout(OverviewPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/members"
      element={withLayout(MembersPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/sputnik-daos"
      element={withLayout(SputnikDaosPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/finishNearLogin"
      element={withLayout(FinishNearLoginPage, {
        scoped: true,
      })}
    />,
    <Route
      path="/finishaxielogin"
      element={withLayout(FinishAxieLoginPage, {})}
    />,

    // NOTIFICATIONS
    <Route
      path="/notifications"
      element={withLayout(NotificationsPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/notification-settings"
      element={withLayout(NotificationSettingsPage, {
        deferChain: true,
      })}
    />,
    // NOTIFICATIONS END

    // GOVERNANCE
    <Route
      path="/referenda"
      element={withLayout(ReferendaPage, {
        scoped: true,
      })}
    />,
    <Route
      path="/proposals"
      element={withLayout(ProposalsPage, {
        scoped: true,
      })}
    />,
    <Route
      path="/proposal/:type/:identifier"
      element={withLayout(ViewProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      path="/proposal/:identifier"
      element={withLayout(ViewProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      path="/new/proposal/:type"
      element={withLayout(NewProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      path="/new/proposal"
      element={withLayout(NewProposalPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    // GOVERNANCE END

    // DISCUSSIONS
    <Route
      path="/discussions"
      element={withLayout(DiscussionsPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/discussions/:topicName"
      element={withLayout(DiscussionsPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/discussion/:identifier"
      element={withLayout(ViewThreadPage, {
        scoped: true,
      })}
    />,
    <Route
      path="/new/discussion"
      element={withLayout(NewThreadPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/proposal/discussion/:identifier"
      element={
        <Navigate to={(parameters) => `/discussion/${parameters.identifier}`} />
      }
    />,
    // DISCUSSIONS END

    // CONTRACTS
    <Route
      path="/new/contract"
      element={withLayout(NewContractPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/contract/:contractAddress"
      element={withLayout(GeneralContractPage, {
        scoped: true,
      })}
    />,
    // CONTRACTS END

    // TREASURY
    <Route
      path="/treasury"
      element={withLayout(TreasuryPage, {
        scoped: true,
      })}
    />,
    <Route
      path="/tips"
      element={withLayout(TipsPage, {
        scoped: true,
      })}
    />,
    // TREASURY END

    // ADMIN
    <Route path="/manage" element={withLayout(ManageCommunityPage, {})} />,
    <Route
      path="/analytics"
      element={withLayout(AnalyticsPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/snapshot/:snapshotId"
      element={withLayout(SnapshotProposalPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/multiple-snapshots"
      element={withLayout(ViewMultipleSnapshotsPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/snapshot/:snapshotId/:identifier"
      element={withLayout(ViewSnapshotsProposalPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/new/snapshot/:snapshotId"
      element={withLayout(NewSnapshotProposalPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    // ADMIN END

    // PROFILES
    <Route
      path="/account/:address"
      element={withLayout(ProfilePageRedirect, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/account"
      element={withLayout(ProfilePageRedirect, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/profile/id/:profileId"
      element={withLayout(NewProfilePage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/profile/id/:profileId/edit"
      element={withLayout(EditNewProfilePage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    // PROFILES END
  ];
};

export default customDomainRoutes;
