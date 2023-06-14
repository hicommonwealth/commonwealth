import { featureFlags } from 'helpers/feature-flags';
import { Navigate } from 'navigation/helpers';
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withLayout } from 'views/Layout';

const LandingPage = lazy(() => import('views/pages/landing'));
const WhyCommonwealthPage = lazy(() => import('views/pages/why_commonwealth'));
const DashboardPage = lazy(() => import('views/pages/user_dashboard'));
const CommunitiesPage = lazy(() => import('views/pages/communities'));
const SearchPage = lazy(() => import('views/pages/search'));
const Web3LoginPage = lazy(() => import('views/pages/web3login'));

const CreateCommunityPage = lazy(() => import('views/pages/create_community'));
const OverviewPage = lazy(() => import('views/pages/overview'));
const MembersPage = lazy(() => import('views/pages/members'));
const SputnikDaosPage = lazy(() => import('views/pages/sputnikdaos'));
const FinishNearLoginPage = lazy(() => import('views/pages/finish_near_login'));
const FinishAxieLoginPage = lazy(() => import('views/pages/finish_axie_login'));
const FinishSocialLoginPage = lazy(
  () => import('views/pages/finish_social_login')
);

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
const ViewThreadPage = lazy(
  () => import('../views/pages/view_thread/ViewThreadPage')
);
const ThreadRedirectPage = lazy(() => import('views/pages/thread_redirect'));
const NewThreadPage = lazy(() => import('views/pages/new_thread'));
const DiscussionsRedirectPage = lazy(
  () => import('views/pages/discussions_redirect')
);
const ChainEntityLinkRedirectPage = lazy(
  () => import('views/pages/chain_entity_link_redirect')
);
const SnapshotProposalLinkRedirectPage = lazy(
  () => import('views/pages/snapshot_proposal_link_redirect')
);
const FeedPage = lazy(() => import('views/pages/feed'));

const ContractsPage = lazy(() => import('views/pages/contracts'));
const NewContractPage = lazy(() => import('views/pages/new_contract'));
const GeneralContractPage = lazy(() => import('views/pages/general_contract'));
const NewContractTemplatePage = lazy(
  () => import('views/pages/new_contract_template')
);
const ViewTemplatePage = lazy(() => import('views/pages/view_template'));

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
const AdminPanelPage = lazy(() => import('views/pages/AdminPanel'));

const NewProfilePage = lazy(() => import('views/pages/new_profile'));
const EditNewProfilePage = lazy(() => import('views/pages/edit_new_profile'));
const ProfilePageRedirect = lazy(() => import('views/pages/profile_redirect'));

const CommonDomainRoutes = () => [
  <Route
    path="/"
    element={withLayout(LandingPage, {
      scoped: false,
      type: 'blank',
    })}
  />,
  <Route
    path="/createCommunity"
    element={withLayout(CreateCommunityPage, {})}
  />,
  <Route
    path="/whyCommonwealth"
    element={withLayout(WhyCommonwealthPage, {
      type: 'common',
    })}
  />,
  <Route
    path="/dashboard"
    element={withLayout(DashboardPage, { type: 'common' })}
  />,
  <Route
    path="/dashboard/:type"
    element={withLayout(DashboardPage, { type: 'common' })}
  />,
  <Route
    path="/communities"
    element={withLayout(CommunitiesPage, {
      type: 'common',
    })}
  />,
  <Route path="/search" element={withLayout(SearchPage, { type: 'common' })} />,
  <Route
    path="/web3login"
    element={withLayout(Web3LoginPage, { type: 'common' })}
  />,
  // scoped
  <Route
    path="/:scope/overview"
    element={withLayout(OverviewPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/search"
    element={withLayout(SearchPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/members"
    element={withLayout(MembersPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/sputnik-daos"
    element={withLayout(SputnikDaosPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/finishNearLogin"
    element={withLayout(FinishNearLoginPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/finishaxielogin"
    element={withLayout(FinishAxieLoginPage, { type: 'common' })}
  />,
  <Route
    path="/finishsociallogin"
    element={withLayout(FinishSocialLoginPage, { type: 'common' })}
  />,
  // NOTIFICATIONS
  <Route
    path="/:scope/notifications"
    element={withLayout(NotificationsPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/notifications"
    element={withLayout(NotificationsPage, {
      scoped: true,
      type: 'common',
    })}
  />,
  <Route
    path="/notification-settings"
    element={withLayout(NotificationSettingsPage, { type: 'common' })}
  />,
  <Route
    path="/:scope/notification-settings"
    element={<Navigate to="/notification-settings" />}
  />,
  // NOTIFICATIONS END

  // GOVERNANCE
  <Route
    path="/:scope/referenda"
    element={withLayout(ReferendaPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/proposals"
    element={withLayout(ProposalsPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/proposal/:type/:identifier"
    element={withLayout(ViewProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/proposal/:identifier"
    element={withLayout(ViewProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/new/proposal/:type"
    element={withLayout(NewProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/new/proposal"
    element={withLayout(NewProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/proposal/discussion/:identifier"
    element={
      <Navigate to={(parameters) => `/discussion/${parameters.identifier}`} />
    }
  />,
  // GOVERNANCE END

  // DISCUSSIONS
  <Route
    path="/:scope/discussions"
    element={withLayout(DiscussionsPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/discussions/:topicName"
    element={withLayout(DiscussionsPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/discussion/:identifier"
    element={withLayout(ViewThreadPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/discussion/:identifier"
    element={withLayout(ThreadRedirectPage, {
      scope: false,
    })}
  />,
  <Route
    path="/:scope/new/discussion"
    element={withLayout(NewThreadPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/proposal/discussion/:identifier"
    element={
      <Navigate
        to={(parameters) =>
          `/${parameters.scope}/discussion/${parameters.identifier}`
        }
      />
    }
  />,
  <Route
    path="/:scope"
    element={withLayout(DiscussionsRedirectPage, {
      scoped: true,
    })}
  />,
  ...(featureFlags.communityHomepage
    ? [
        <Route
          path="/:scope/feed"
          element={withLayout(FeedPage, {
            scoped: true,
          })}
        />,
      ]
    : []),
  // DISCUSSIONS END

  // CONTRACTS
  ...(featureFlags.proposalTemplates
    ? [
        <Route
          path="/:scope/contracts"
          element={withLayout(ContractsPage, {
            scoped: true,
          })}
        />,
        <Route
          path="/:scope/new/contract"
          element={withLayout(NewContractPage, {
            scoped: true,
          })}
        />,
        <Route
          path="/:scope/new/contract_template/:contract_id"
          element={withLayout(NewContractTemplatePage, {
            scoped: true,
          })}
        />,
        <Route
          path="/:scope/contract/:contractAddress"
          element={withLayout(GeneralContractPage, {
            scoped: true,
          })}
        />,
        <Route
          path="/:scope/:contract_address/:slug"
          element={withLayout(ViewTemplatePage, {
            scoped: true,
          })}
        />,
      ]
    : []),
  // CONTRACTS END

  // TREASURY
  <Route
    path="/:scope/treasury"
    element={withLayout(TreasuryPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/tips"
    element={withLayout(TipsPage, {
      scoped: true,
    })}
  />,
  // TREASURY END

  // SITE ADMIN
  <Route
    path="/admin-panel"
    element={withLayout(AdminPanelPage, { type: 'common' })}
  />,

  // ADMIN
  <Route
    path="/:scope/manage"
    element={withLayout(ManageCommunityPage, {
      scoped: true,
    })}
  />,
  <Route path="/manage" element={withLayout(ManageCommunityPage, {})} />,
  <Route
    path="/:scope/analytics"
    element={withLayout(AnalyticsPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/snapshot/:snapshotId"
    element={withLayout(SnapshotProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/multiple-snapshots"
    element={withLayout(ViewMultipleSnapshotsPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/snapshot/:snapshotId/:identifier"
    element={withLayout(ViewSnapshotsProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/new/snapshot/:snapshotId"
    element={withLayout(NewSnapshotProposalPage, {
      scoped: true,
    })}
  />,
  // snapshot proposals redirects
  <Route
    path="/:scope/snapshot-proposals/:snapshotId"
    element={
      // redirect to SnapshotProposalPage
      <Navigate
        to={(parameters) =>
          `/${parameters.scope}/snapshot/${parameters.snapshotId}`
        }
      />
    }
  />,
  <Route
    path="/:scope/snapshot-proposal/:snapshotId/:identifier"
    element={
      // redirect to ViewSnapshotsProposalPage
      <Navigate
        to={(parameters) =>
          `/${parameters.scope}/snapshot/${parameters.snapshotId}/${parameters.identifier}`
        }
      />
    }
  />,
  <Route
    path="/:scope/snapshot-proposals/:snapshotId/:identifier"
    element={
      // redirect to ViewSnapshotsProposalPage
      <Navigate
        to={(parameters) =>
          `/${parameters.scope}/snapshot/${parameters.snapshotId}/${parameters.identifier}`
        }
      />
    }
  />,
  <Route
    path="/:scope/new/snapshot-proposal/:snapshotId"
    element={
      // redirect to NewSnapshotProposalPage
      <Navigate
        to={(parameters) =>
          `/${parameters.scope}/new/snapshot/${parameters.snapshotId}`
        }
      />
    }
  />,
  <Route
    path="/:scope/new/snapshot-proposals/:snapshotId"
    element={
      // redirect to NewSnapshotProposalPage
      <Navigate
        to={(parameters) =>
          `/${parameters.scope}/new/snapshot/${parameters.snapshotId}`
        }
      />
    }
  />,
  // ADMIN END

  // PROFILES
  <Route
    path="/:scope/account/:address"
    element={withLayout(ProfilePageRedirect, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/account"
    element={withLayout(ProfilePageRedirect, {
      scoped: true,
    })}
  />,
  <Route
    path="/profile/id/:profileId"
    element={withLayout(NewProfilePage, {
      scoped: true,
      type: 'common',
    })}
  />,
  <Route
    path="/profile/edit"
    element={withLayout(EditNewProfilePage, {
      scoped: true,
      type: 'common',
    })}
  />,
  // PROFILES END

  // LEGACY LINKING REDIRECTS
  // These redirects exist so we can land on a properly identified page
  // without loading additional metadata on the view thread page to construct
  // a proper link. Each of these routes will:
  // (a) load external data as needed (from snapshot, chain events, etc) to
  // (b) produce a correct link to the entity (whether /snapshot/space/id or /proposal/id), and
  // (c) update the link objects associated with the identifer to point at the correct page.
  <Route
    path="/:scope/link/chain-entity/:identifier"
    element={withLayout(ChainEntityLinkRedirectPage, {
      scoped: true,
    })}
  />,
  <Route
    path="/:scope/link/snapshot-proposal/:identifier"
    element={withLayout(SnapshotProposalLinkRedirectPage, {
      scoped: true,
    })}
  />,

  // LEGACY REDIRECTS
  //here for compatibility only
  <Route path="/discussions" element={<Navigate to="/" />} />,
  <Route path="/home" element={<Navigate to="/" />} />,
  <Route
    path="/:scope/home"
    element={<Navigate to={(parameters) => `/${parameters.scope}/`} />}
  />,
  // LEGACY REDIRECTS END
];

export default CommonDomainRoutes;
