import { Navigate } from 'navigation/helpers';
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withLayout } from 'views/Layout';
import { RouteFeatureFlags } from './Router';

const SearchPage = lazy(() => import('views/pages/search'));
const HomePage = lazy(() => import('views/pages/HomePage/HomePage'));

const CreateCommunityPage = lazy(() => import('views/pages/CreateCommunity'));
const CreateQuestPage = lazy(() => import('views/pages/CreateQuest'));
const UpdateQuestPage = lazy(() => import('views/pages/UpdateQuest'));
const QuestDetailsPage = lazy(() => import('views/pages/QuestDetails'));
const QuestsListPage = lazy(() => import('views/pages/QuestsList'));
const LaunchTokenPage = lazy(() => import('views/pages/LaunchToken'));
const OverviewPage = lazy(() => import('views/pages/overview'));
const MembersPage = lazy(
  () =>
    import(
      'views/pages/CommunityGroupsAndMembers/Members/CommunityMembersPage'
    ),
);
const DirectoryPage = lazy(() => import('views/pages/DirectoryPage'));
const CreateMembersGroupPage = lazy(
  () => import('views/pages/CommunityGroupsAndMembers/Groups/Create'),
);
const UpdateMembersGroupPage = lazy(
  () => import('views/pages/CommunityGroupsAndMembers/Groups/Update'),
);
const FinishSocialLoginPage = lazy(
  () => import('views/pages/finish_social_login'),
);

const NotificationsPage = lazy(() => import('views/pages/notifications'));

const NotificationSettings = lazy(
  () => import('views/pages/NotificationSettings'),
);
const LeaderboardPage = lazy(() => import('views/pages/Leaderboard'));

const ProposalsPage = lazy(() => import('views/pages/proposals'));
const ViewProposalPage = lazy(() => import('views/pages/view_proposal/index'));
const NewProposalPage = lazy(() => import('views/pages/new_proposal/index'));

const DiscussionsPage = lazy(
  () => import('views/pages/discussions/DiscussionsPage'),
);
const ViewThreadPage = lazy(
  () => import('views/pages/view_thread/ViewThreadPage'),
);
const NewThreadPage = lazy(() => import('views/pages/new_thread'));
const DiscussionsRedirectPage = lazy(
  () => import('views/pages/discussions_redirect'),
);
const SnapshotProposalLinkRedirectPage = lazy(
  () => import('views/pages/snapshot_proposal_link_redirect'),
);

const DiscordCallbackPage = lazy(
  () =>
    import('views/pages/CommunityManagement/Integrations/Discord/CallbackPage'),
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
const CommunityStakeIntegration = lazy(
  () => import('views/pages/CommunityManagement/StakeIntegration'),
);
const CommunityTokenIntegration = lazy(
  () => import('views/pages/CommunityManagement/TokenIntegration'),
);
const CommunityTopics = lazy(
  () => import('views/pages/CommunityManagement/Topics'),
);
const AdminContestsPage = lazy(
  () => import('views/pages/CommunityManagement/Contests/AdminContestsPage'),
);
const ManageContest = lazy(
  () => import('views/pages/CommunityManagement/Contests/ManageContest'),
);
const Contests = lazy(() => import('views/pages/Contests'));
const ContestPage = lazy(() => import('views/pages/ContestPage'));

const MyTransactions = lazy(() => import('views/pages/MyTransactions'));

const SnapshotProposalPage = lazy(
  () => import('views/pages/Snapshots/SnapshotProposals'),
);
const ViewMultipleSnapshotsPage = lazy(
  () => import('views/pages/Snapshots/MultipleSnapshots'),
);
const ViewSnapshotsProposalPage = lazy(
  () => import('views/pages/Snapshots/ViewSnapshotProposal'),
);
const NewSnapshotProposalPage = lazy(
  () => import('views/pages/Snapshots/NewSnapshotProposal'),
);

const NewProfilePage = lazy(() => import('views/pages/new_profile'));
const EditNewProfilePage = lazy(() => import('views/pages/edit_new_profile'));
const ProfilePageRedirect = lazy(() => import('views/pages/profile_redirect'));
const UnSubscribePage = lazy(() => import('views/pages/UnSubscribePage'));

const RewardsPage = lazy(() => import('views/pages/RewardsPage'));
const CommunityHomePage = lazy(
  () => import('../views/pages/CommunityHome/CommunityHomePage'),
);

const CustomDomainRoutes = ({
  launchpadEnabled,
  xpEnabled,
  communityHomeEnabled,
  homePageEnable,
}: RouteFeatureFlags) => {
  return [
    <Route
      key="/"
      path="/"
      element={withLayout(DiscussionsRedirectPage, {
        scoped: true,
        type: 'blank',
      })}
    />,
    <Route
      key="/createCommunity"
      path="/createCommunity"
      element={withLayout(CreateCommunityPage, { type: 'common' })}
    />,
    ...(xpEnabled
      ? [
          <Route
            key="/createQuest"
            path="/createQuest"
            element={withLayout(CreateQuestPage, { type: 'common' })}
          />,
          <Route
            key="/quests/:id"
            path="/quests/:id"
            element={withLayout(QuestDetailsPage, { type: 'common' })}
          />,
          <Route
            key="/quests/:id/update"
            path="/quests/:id/update"
            element={withLayout(UpdateQuestPage, { type: 'common' })}
          />,
          <Route
            key="/:scope/quests/:id"
            path="/:scope/quests/:id"
            element={withLayout(QuestDetailsPage, { scoped: true })}
          />,
          <Route
            key="/:scope/quests/:id/update"
            path="/:scope/quests/:id/update"
            element={withLayout(UpdateQuestPage, { scoped: true })}
          />,
          <Route
            key="/:scope/quests"
            path="/:scope/quests"
            element={withLayout(QuestsListPage, { scoped: true })}
          />,
        ]
      : []),
    <Route
      key="/unSubscribe/:userId"
      path="/unSubscribe/:userId"
      element={withLayout(UnSubscribePage, { type: 'common' })}
    />,
    ...(launchpadEnabled
      ? [
          <Route
            key="/createTokenCommunity"
            path="/createTokenCommunity"
            element={withLayout(LaunchTokenPage, { type: 'common' })}
          />,
        ]
      : []),
    ...(xpEnabled
      ? [
          <Route
            key="/leaderboard"
            path="/leaderboard"
            element={withLayout(LeaderboardPage, { type: 'common' })}
          />,
        ]
      : []),
    ...(homePageEnable
      ? [
          <Route
            key="/home"
            path="/home"
            element={withLayout(HomePage, { type: 'common' })}
          />,
        ]
      : []),
    <Route
      key="/search"
      path="/search"
      element={withLayout(SearchPage, { type: 'common' })}
    />,
    <Route
      key="/overview"
      path="/overview"
      element={withLayout(OverviewPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/members"
      path="/members"
      element={withLayout(MembersPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/members/groups/create"
      path="/members/groups/create"
      element={withLayout(CreateMembersGroupPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/members/groups/:groupId/update"
      path="/members/groups/:groupId/update"
      element={withLayout(UpdateMembersGroupPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/directory"
      path="/directory"
      element={withLayout(DirectoryPage, { scoped: true })}
    />,
    <Route
      key="/finishsociallogin"
      path="/finishsociallogin"
      element={withLayout(FinishSocialLoginPage, { type: 'common' })}
    />,
    <Route
      key="/myTransactions"
      path="/myTransactions"
      element={withLayout(MyTransactions, { type: 'common' })}
    />,
    <Route
      key="/rewards"
      path="/rewards"
      element={withLayout(RewardsPage, { type: 'common' })}
    />,

    // NOTIFICATIONS
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
      element={withLayout(NotificationSettings, { type: 'common' })}
    />,
    // NOTIFICATIONS END

    // GOVERNANCE
    <Route
      key="/proposals"
      path="/proposals"
      element={withLayout(ProposalsPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/proposal/:type/:identifier"
      path="/proposal/:type/:identifier"
      element={withLayout(ViewProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/proposal/:identifier"
      path="/proposal/:identifier"
      element={withLayout(ViewProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/new/proposal/:type"
      path="/new/proposal/:type"
      element={withLayout(NewProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/new/proposal"
      path="/new/proposal"
      element={withLayout(NewProposalPage, {
        scoped: true,
      })}
    />,
    // GOVERNANCE END

    // DISCUSSIONS
    ...(communityHomeEnabled
      ? [
          <Route
            key="/community-home"
            path="/community-home"
            element={withLayout(CommunityHomePage, {
              scoped: true,
            })}
          />,
        ]
      : []),
    <Route
      key="/discussions"
      path="/discussions"
      element={withLayout(DiscussionsPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/discussions/:topicName"
      path="/discussions/:topicName"
      element={withLayout(DiscussionsPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/discussion/:identifier"
      path="/discussion/:identifier"
      element={withLayout(ViewThreadPage, {
        scoped: true,
        renderDefaultMetatags: false,
      })}
    />,
    <Route
      key="/new/discussion"
      path="/new/discussion"
      element={withLayout(NewThreadPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/proposal/discussion/:identifier"
      path="/proposal/discussion/:identifier"
      element={
        <Navigate to={(parameters) => `/discussion/${parameters.identifier}`} />
      }
    />,
    <Route
      key={0}
      path="/archived"
      element={withLayout(DiscussionsPage, {
        scoped: true,
      })}
    />,
    // DISCUSSIONS END

    // ADMIN
    <Route
      key="/manage/profile"
      path="/manage/profile"
      element={withLayout(CommunityProfile, {
        scoped: true,
      })}
    />,
    <Route
      key="/manage/integrations"
      path="/manage/integrations"
      element={withLayout(CommunityIntegrations, {
        scoped: true,
      })}
    />,
    <Route
      key="/manage/integrations/stake"
      path="/manage/integrations/stake"
      element={withLayout(CommunityStakeIntegration, {
        scoped: true,
      })}
    />,
    <Route
      key="/manage/integrations/token"
      path="/manage/integrations/token"
      element={withLayout(CommunityTokenIntegration, {
        scoped: true,
      })}
    />,
    <Route
      key="/manage/topics"
      path="/manage/topics"
      element={withLayout(CommunityTopics, {
        scoped: true,
      })}
    />,
    <Route
      key="/manage/moderators"
      path="/manage/moderators"
      element={withLayout(CommunityAdminAndModerators, {
        scoped: true,
      })}
    />,
    <Route
      key="/manage/contests"
      path="/manage/contests"
      element={withLayout(AdminContestsPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/manage/contests/launch"
      path="/manage/contests/launch"
      element={withLayout(ManageContest, {
        scoped: true,
      })}
    />,
    <Route
      key="/manage/contests/:contestAddress"
      path="/manage/contests/:contestAddress"
      element={withLayout(ManageContest, {
        scoped: true,
      })}
    />,
    <Route
      key="/contests"
      path="/contests"
      element={withLayout(Contests, {
        scoped: true,
      })}
    />,
    <Route
      key="/:scope/contests/:contestAddress"
      path="/:scope/contests/:contestAddress"
      element={withLayout(ContestPage, {
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
      key="/analytics"
      path="/analytics"
      element={withLayout(AnalyticsPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/snapshot/:snapshotId"
      path="/snapshot/:snapshotId"
      element={withLayout(SnapshotProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/multiple-snapshots"
      path="/multiple-snapshots"
      element={withLayout(ViewMultipleSnapshotsPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/snapshot/:snapshotId/:identifier"
      path="/snapshot/:snapshotId/:identifier"
      element={withLayout(ViewSnapshotsProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/new/snapshot/:snapshotId"
      path="/new/snapshot/:snapshotId"
      element={withLayout(NewSnapshotProposalPage, {
        scoped: true,
      })}
    />,
    // ADMIN END

    // PROFILES
    <Route
      key="/account/:address"
      path="/account/:address"
      element={withLayout(ProfilePageRedirect, {
        scoped: true,
        type: 'common',
      })}
    />,
    <Route
      key="/account"
      path="/account"
      element={withLayout(ProfilePageRedirect, {
        scoped: true,
        type: 'common',
      })}
    />,
    <Route
      key="/profile/id/:userId"
      path="/profile/id/:userId"
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

    // REDIRECTS //
    <Route
      key="/:scope/home"
      path="/:scope/home"
      element={<Navigate to="/overview" />}
    />,
    <Route
      key="/:scope/search"
      path="/:scope/search"
      element={<Navigate to="/search" />}
    />,
    <Route
      key="/:scope/overview"
      path="/:scope/overview"
      element={<Navigate to="/overview" />}
    />,
    <Route
      key="/:scope/members"
      path="/:scope/members"
      element={<Navigate to="/members" />}
    />,
    <Route
      key="/:scope/finishsociallogin"
      path="/:scope/finishsociallogin"
      element={<Navigate to="/finishsociallogin" />}
    />,

    // NOTIFICATIONS
    <Route
      key="/:scope/notifications"
      path="/:scope/notifications"
      element={<Navigate to="/notifications" />}
    />,
    <Route
      key="/:scope/notification-settings"
      path="/:scope/notification-settings"
      element={<Navigate to="/notification-settings" />}
    />,
    // NOTIFICATIONS END

    // GOVERNANCE
    <Route
      key="/:scope/referenda"
      path="/:scope/referenda"
      element={<Navigate to="/referenda" />}
    />,
    <Route
      key="/:scope/proposals"
      path="/:scope/proposals"
      element={<Navigate to="/proposals" />}
    />,
    <Route
      key="/:scope/proposal/:type/:identifier"
      path="/:scope/proposal/:type/:identifier"
      element={
        <Navigate
          to={(parameters) =>
            `/proposal/${parameters.type}/${parameters.identifier}`
          }
        />
      }
    />,
    <Route
      key="/:scope/proposal/:identifier"
      path="/:scope/proposal/:identifier"
      element={
        <Navigate to={(parameters) => `/proposal/${parameters.identifier}`} />
      }
    />,
    <Route
      key="/:scope/new/proposal/:type"
      path="/:scope/new/proposal/:type"
      element={
        <Navigate to={(parameters) => `/new/proposal/${parameters.type}`} />
      }
    />,
    <Route
      key="/:scope/new/proposal"
      path="/:scope/new/proposal"
      element={<Navigate to="/new/proposal" />}
    />,
    // GOVERNANCE END

    // DISCUSSIONS
    <Route
      key="/:scope/discussions"
      path="/:scope/discussions"
      element={<Navigate to="/discussions" />}
    />,
    <Route
      key="/:scope/discussions/:topicName"
      path="/:scope/discussions/:topicName"
      element={
        <Navigate to={(parameters) => `/discussions/${parameters.topicName}`} />
      }
    />,
    <Route
      key="/:scope/discussion/:identifier"
      path="/:scope/discussion/:identifier"
      element={
        <Navigate to={(parameters) => `/discussion/${parameters.identifier}`} />
      }
    />,
    <Route
      key="/:scope/new/discussion"
      path="/:scope/new/discussion"
      element={<Navigate to="/new/discussion" />}
    />,
    <Route
      key="/:scope/proposal/discussion/:identifier"
      path="/:scope/proposal/discussion/:identifier"
      element={
        <Navigate
          to={(parameters) => `/proposal/discussion/${parameters.identifier}`}
        />
      }
    />,
    // DISCUSSIONS END

    // TREASURY
    <Route
      key="/:scope/treasury"
      path="/:scope/treasury"
      element={<Navigate to="/treasury" />}
    />,
    <Route
      key="/:scope/tips"
      path="/:scope/tips"
      element={<Navigate to="/tips" />}
    />,
    // TREASURY END

    // ADMIN
    <Route
      key="/:scope/analytics"
      path="/:scope/analytics"
      element={<Navigate to="/analytics" />}
    />,
    <Route
      key="/:scope/snapshot/:snapshotId"
      path="/:scope/snapshot/:snapshotId"
      element={
        <Navigate to={(parameters) => `/snapshot/${parameters.snapshotId}`} />
      }
    />,
    <Route
      key="/:scope/multiple-snapshots"
      path="/:scope/multiple-snapshots"
      element={<Navigate to="/multiple-snapshots" />}
    />,
    <Route
      key="/:scope/snapshot/:snapshotId/:identifier"
      path="/:scope/snapshot/:snapshotId/:identifier"
      element={
        <Navigate
          to={(parameters) =>
            `/snapshot/${parameters.snapshotId}/${parameters.identifier}`
          }
        />
      }
    />,
    <Route
      key="/:scope/new/snapshot/:snapshotId"
      path="/:scope/new/snapshot/:snapshotId"
      element={
        <Navigate
          to={(parameters) => `/new/snapshot/${parameters.snapshotId}`}
        />
      }
    />,
    // ADMIN END

    // PROFILES
    <Route
      key="/:scope/account/:address"
      path="/:scope/account/:address"
      element={<Navigate to="/account/:address" />}
    />,
    <Route
      key="/:scope/account"
      path="/:scope/account"
      element={<Navigate to="/account" />}
    />,
    <Route
      key="/:scope/profile/id/:userId"
      path="/:scope/profile/id/:userId"
      element={
        <Navigate to={(parameters) => `/profile/id/${parameters.userId}`} />
      }
    />,
    <Route
      key="/:scope/profile/edit"
      path="/:scope/profile/edit"
      element={<Navigate to="/profile/edit" />}
    />,

    // LEGACY LINKING REDIRECTS
    // These redirects exist so we can land on a properly identified page
    // without loading additional metadata on the view thread page to construct
    // a proper link. Each of these routes will:
    // (a) load external data as needed (from snapshot, chain events, etc) to
    // (b) produce a correct link to the entity (whether /snapshot/space/id or /proposal/id), and
    // (c) update the link objects associated with the identifer to point at the correct page.
    <Route
      key="/link/snapshot-proposal/:identifier"
      path="/link/snapshot-proposal/:identifier"
      element={withLayout(SnapshotProposalLinkRedirectPage, {
        scoped: true,
      })}
    />,
  ];
};

export default CustomDomainRoutes;
