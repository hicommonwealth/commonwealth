import { Navigate } from 'navigation/helpers';
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withLayout } from 'views/Layout';
import { RouteFeatureFlags } from './Router';

const LandingPage = lazy(() => import('views/pages/landing'));
const WhyCommonwealthPage = lazy(() => import('views/pages/why_commonwealth'));
const DashboardPage = lazy(() => import('views/pages/user_dashboard'));
const CommunitiesPage = lazy(() => import('views/pages/communities'));
const SearchPage = lazy(() => import('views/pages/search'));
const Web3LoginPage = lazy(() => import('views/pages/web3login'));

const CreateCommunityPage = lazy(() => import('views/pages/CreateCommunity'));
const OverviewPage = lazy(() => import('views/pages/overview'));
const MembersPage = lazy(
  () => import('views/pages/Community/Members/CommunityMembersPage'),
);
const CreateMembersGroupPage = lazy(
  () => import('views/pages/Community/Groups/Create'),
);
const UpdateMembersGroupPage = lazy(
  () => import('views/pages/Community/Groups/Update'),
);
const DirectoryPage = lazy(() => import('views/pages/DirectoryPage'));
const SputnikDaosPage = lazy(() => import('views/pages/sputnikdaos'));
const FinishNearLoginPage = lazy(() => import('views/pages/finish_near_login'));
const FinishAxieLoginPage = lazy(() => import('views/pages/finish_axie_login'));
const FinishSocialLoginPage = lazy(
  () => import('views/pages/finish_social_login'),
);

const NotificationsPage = lazy(() => import('views/pages/notifications'));
const NotificationSettingsPage = lazy(
  () => import('views/pages/notification_settings'),
);

const ProposalsPage = lazy(() => import('views/pages/proposals'));
const ViewProposalPage = lazy(() => import('views/pages/view_proposal/index'));
const NewProposalPage = lazy(() => import('views/pages/new_proposal/index'));

const DiscussionsPage = lazy(
  () => import('views/pages/discussions/DiscussionsPage'),
);
const ViewThreadPage = lazy(
  () => import('../views/pages/view_thread/ViewThreadPage'),
);
const ThreadRedirectPage = lazy(() => import('views/pages/thread_redirect'));
const NewThreadPage = lazy(() => import('views/pages/new_thread'));
const DiscussionsRedirectPage = lazy(
  () => import('views/pages/discussions_redirect'),
);
const SnapshotProposalLinkRedirectPage = lazy(
  () => import('views/pages/snapshot_proposal_link_redirect'),
);
const FeedPage = lazy(() => import('views/pages/feed'));

const ContractsPage = lazy(() => import('views/pages/contracts'));
const NewContractPage = lazy(() => import('views/pages/new_contract'));
const GeneralContractPage = lazy(() => import('views/pages/general_contract'));
const NewContractTemplatePage = lazy(
  () => import('views/pages/new_contract_template'),
);
const ViewTemplatePage = lazy(() => import('views/pages/view_template'));

const ManageCommunityPage = lazy(
  () => import('views/pages/manage_community/ManageCommunityPage'),
);
const DiscordCallbackPage = lazy(
  () => import('views/pages/manage_community/discord-callback'),
);
const AnalyticsPage = lazy(() => import('views/pages/stats'));

const CommunityAdminAndModerators = lazy(
  () => import('views/pages/CommunityManagement/AdminsAndModerators'),
);
const CommunityProfile = lazy(
  () => import('views/pages/CommunityManagement/CommunityProfile'),
);
const CommunityIntegrations = lazy(
  () => import('views/pages/CommunityManagement/Integrations'),
);
const CommunityTopics = lazy(
  () => import('views/pages/CommunityManagement/Topics'),
);

const SnapshotProposalPage = lazy(
  () => import('views/pages/snapshot_proposals'),
);
const ViewMultipleSnapshotsPage = lazy(
  () => import('views/pages/view_multiple_snapshot_spaces'),
);
const ViewSnapshotsProposalPage = lazy(
  () => import('views/pages/view_snapshot_proposal'),
);
const NewSnapshotProposalPage = lazy(
  () => import('views/pages/new_snapshot_proposal/NewSnapshotProposalPage'),
);
const AdminPanelPage = lazy(() => import('views/pages/AdminPanel'));

const NewProfilePage = lazy(() => import('views/pages/new_profile'));
const EditNewProfilePage = lazy(() => import('views/pages/edit_new_profile'));
const ProfilePageRedirect = lazy(() => import('views/pages/profile_redirect'));

const CommonDomainRoutes = ({
  proposalTemplatesEnabled,
  newAdminOnboardingEnabled,
  communityHomepageEnabled,
}: RouteFeatureFlags) => [
  <Route
    key="/"
    path="/"
    element={withLayout(LandingPage, {
      scoped: false,
      type: 'blank',
    })}
  />,
  <Route
    key="/createCommunity"
    path="/createCommunity"
    element={withLayout(CreateCommunityPage, { type: 'common' })}
  />,
  <Route
    key="/whyCommonwealth"
    path="/whyCommonwealth"
    element={withLayout(WhyCommonwealthPage, {
      type: 'common',
    })}
  />,
  <Route
    key="/dashboard"
    path="/dashboard"
    element={withLayout(DashboardPage, { type: 'common' })}
  />,
  <Route
    key="/dashboard/:type"
    path="/dashboard/:type"
    element={withLayout(DashboardPage, { type: 'common' })}
  />,
  <Route
    key="/communities"
    path="/communities"
    element={withLayout(CommunitiesPage, {
      type: 'common',
    })}
  />,
  <Route
    key="/search"
    path="/search"
    element={withLayout(SearchPage, { type: 'common' })}
  />,
  <Route
    key="/web3login"
    path="/web3login"
    element={withLayout(Web3LoginPage, { type: 'common' })}
  />,
  // scoped
  <Route
    key="/:scope/overview"
    path="/:scope/overview"
    element={withLayout(OverviewPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/search"
    path="/:scope/search"
    element={withLayout(SearchPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/members"
    path="/:scope/members"
    element={withLayout(MembersPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/members/groups/create"
    path="/:scope/members/groups/create"
    element={withLayout(CreateMembersGroupPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/members/groups/:groupId/update"
    path="/:scope/members/groups/:groupId/update"
    element={withLayout(UpdateMembersGroupPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/directory"
    path="/:scope/directory"
    element={withLayout(DirectoryPage, { scoped: true })}
  />,
  <Route
    key="/:scope/sputnik-daos"
    path="/:scope/sputnik-daos"
    element={withLayout(SputnikDaosPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/finishNearLogin"
    path="/:scope/finishNearLogin"
    element={withLayout(FinishNearLoginPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/finishaxielogin"
    path="/finishaxielogin"
    element={withLayout(FinishAxieLoginPage, { type: 'common' })}
  />,
  <Route
    key="/finishsociallogin"
    path="/finishsociallogin"
    element={withLayout(FinishSocialLoginPage, { type: 'common' })}
  />,
  // NOTIFICATIONS
  <Route
    key="/:scope/notifications"
    path="/:scope/notifications"
    element={withLayout(NotificationsPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/notifications"
    path="/notifications"
    element={withLayout(NotificationsPage, {
      scoped: true,
      type: 'common',
    })}
  />,
  <Route
    key="/notification-settings"
    path="/notification-settings"
    element={withLayout(NotificationSettingsPage, { type: 'common' })}
  />,
  <Route
    key="/:scope/notification-settings"
    path="/:scope/notification-settings"
    element={<Navigate to="/notification-settings" />}
  />,
  // NOTIFICATIONS END

  // GOVERNANCE
  <Route
    key="/:scope/proposals"
    path="/:scope/proposals"
    element={withLayout(ProposalsPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/proposal/:type/:identifier"
    path="/:scope/proposal/:type/:identifier"
    element={withLayout(ViewProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/proposal/:identifier"
    path="/:scope/proposal/:identifier"
    element={withLayout(ViewProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/new/proposal/:type"
    path="/:scope/new/proposal/:type"
    element={withLayout(NewProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/new/proposal"
    path="/:scope/new/proposal"
    element={withLayout(NewProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/proposal/discussion/:identifier"
    path="/:scope/proposal/discussion/:identifier"
    element={
      <Navigate to={(parameters) => `/discussion/${parameters.identifier}`} />
    }
  />,
  // GOVERNANCE END

  // DISCUSSIONS
  <Route
    key="/:scope/discussions"
    path="/:scope/discussions"
    element={withLayout(DiscussionsPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/discussions/:topicName"
    path="/:scope/discussions/:topicName"
    element={withLayout(DiscussionsPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/discussion/:identifier"
    path="/:scope/discussion/:identifier"
    element={withLayout(ViewThreadPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/discussion/:identifier"
    path="/discussion/:identifier"
    element={withLayout(ThreadRedirectPage, {
      scope: false,
    })}
  />,
  <Route
    key="/:scope/new/discussion"
    path="/:scope/new/discussion"
    element={withLayout(NewThreadPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/proposal/discussion/:identifier"
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
    key="/:scope"
    path="/:scope"
    element={withLayout(DiscussionsRedirectPage, {
      scoped: true,
    })}
  />,
  ...(communityHomepageEnabled
    ? [
        <Route
          key="/:scope/feed"
          path="/:scope/feed"
          element={withLayout(FeedPage, {
            scoped: true,
          })}
        />,
      ]
    : []),
  <Route
    key={0}
    path="/:scope/archived"
    element={withLayout(DiscussionsPage, {
      scoped: true,
    })}
  />,
  // DISCUSSIONS END

  // CONTRACTS
  ...(proposalTemplatesEnabled
    ? [
        <Route
          key="/:scope/contracts"
          path="/:scope/contracts"
          element={withLayout(ContractsPage, {
            scoped: true,
          })}
        />,
        <Route
          key="/:scope/new/contract"
          path="/:scope/new/contract"
          element={withLayout(NewContractPage, {
            scoped: true,
          })}
        />,
        <Route
          key="/:scope/new/contract_template/:contract_id"
          path="/:scope/new/contract_template/:contract_id"
          element={withLayout(NewContractTemplatePage, {
            scoped: true,
          })}
        />,
        <Route
          key="/:scope/contract/:contractAddress"
          path="/:scope/contract/:contractAddress"
          element={withLayout(GeneralContractPage, {
            scoped: true,
          })}
        />,
        <Route
          key="/:scope/:contract_address/:slug"
          path="/:scope/:contract_address/:slug"
          element={withLayout(ViewTemplatePage, {
            scoped: true,
          })}
        />,
      ]
    : []),
  // CONTRACTS END

  // SITE ADMIN
  <Route
    key="/admin-panel"
    path="/admin-panel"
    element={withLayout(AdminPanelPage, { type: 'common' })}
  />,

  // ADMIN
  ...(newAdminOnboardingEnabled
    ? [
        <Route
          key="/:scope/manage/profile"
          path="/:scope/manage/profile"
          element={withLayout(CommunityProfile, {
            scoped: true,
          })}
        />,
        <Route
          key="/:scope/manage/integrations"
          path="/:scope/manage/integrations"
          element={withLayout(CommunityIntegrations, {
            scoped: true,
          })}
        />,
        <Route
          key="/:scope/manage/topics"
          path="/:scope/manage/topics"
          element={withLayout(CommunityTopics, {
            scoped: true,
          })}
        />,
        <Route
          key="/:scope/manage/moderators"
          path="/:scope/manage/moderators"
          element={withLayout(CommunityAdminAndModerators, {
            scoped: true,
          })}
        />,
      ]
    : [
        <Route
          key="/:scope/manage"
          path="/:scope/manage"
          element={withLayout(ManageCommunityPage, {
            scoped: true,
          })}
        />,
        <Route
          key="/manage"
          path="/manage"
          element={withLayout(ManageCommunityPage, {})}
        />,
      ]),
  <Route
    key="/:scope/analytics"
    path="/:scope/analytics"
    element={withLayout(AnalyticsPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/discord-callback"
    path="/discord-callback"
    element={withLayout(DiscordCallbackPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/snapshot/:snapshotId"
    path="/:scope/snapshot/:snapshotId"
    element={withLayout(SnapshotProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/multiple-snapshots"
    path="/:scope/multiple-snapshots"
    element={withLayout(ViewMultipleSnapshotsPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/snapshot/:snapshotId/:identifier"
    path="/:scope/snapshot/:snapshotId/:identifier"
    element={withLayout(ViewSnapshotsProposalPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/new/snapshot/:snapshotId"
    path="/:scope/new/snapshot/:snapshotId"
    element={withLayout(NewSnapshotProposalPage, {
      scoped: true,
    })}
  />,
  // snapshot proposals redirects
  <Route
    key="/:scope/snapshot-proposals/:snapshotId"
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
    key="/:scope/snapshot-proposal/:snapshotId/:identifier"
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
    key="/:scope/snapshot-proposals/:snapshotId/:identifier"
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
    key="/:scope/new/snapshot-proposal/:snapshotId"
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
    key="/:scope/new/snapshot-proposals/:snapshotId"
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
    key="/:scope/account/:address"
    path="/:scope/account/:address"
    element={withLayout(ProfilePageRedirect, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/account"
    path="/:scope/account"
    element={withLayout(ProfilePageRedirect, {
      scoped: true,
    })}
  />,
  <Route
    key="/profile/id/:profileId"
    path="/profile/id/:profileId"
    element={withLayout(NewProfilePage, {
      scoped: true,
      type: 'common',
    })}
  />,
  <Route
    key="/profile/edit"
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
    key="/:scope/link/snapshot-proposal/:identifier"
    path="/:scope/link/snapshot-proposal/:identifier"
    element={withLayout(SnapshotProposalLinkRedirectPage, {
      scoped: true,
    })}
  />,

  // LEGACY REDIRECTS
  //here for compatibility only
  <Route
    key="/discussions"
    path="/discussions"
    element={<Navigate to="/" />}
  />,
  <Route key="/home" path="/home" element={<Navigate to="/" />} />,
  <Route
    key="/:scope/home"
    path="/:scope/home"
    element={<Navigate to={(parameters) => `/${parameters.scope}/`} />}
  />,
  // LEGACY REDIRECTS END
];

export default CommonDomainRoutes;
