import { Navigate } from 'navigation/helpers';
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withLayout } from 'views/Layout';
import { MobileSignIn } from 'views/modals/MobileSignIn/MobileSignIn';
import { MobileAppRedirect } from 'views/pages/MobileAppRedirect/MobileAppRedirect';

const QuillPage = lazy(() => import('views/pages/QuillPage'));
const MarkdownEditorPage = lazy(() => import('views/pages/MarkdownEditorPage'));
const MarkdownViewerPage = lazy(() => import('views/pages/MarkdownViewerPage'));
const MarkdownHitHighlighterPage = lazy(
  () => import('views/pages/MarkdownHitHighlighterPage'),
);

const DashboardPage = lazy(() => import('views/pages/user_dashboard'));
const CommunitiesPage = lazy(() => import('views/pages/Communities'));
const SearchPage = lazy(() => import('views/pages/search'));
const HomePage = lazy(() => import('views/pages/HomePage/HomePage'));

const CreateCommunityPage = lazy(() => import('views/pages/CreateCommunity'));
const CreateQuestPage = lazy(() => import('views/pages/CreateQuest'));
const UpdateQuestPage = lazy(() => import('views/pages/UpdateQuest'));
const QuestDetailsPage = lazy(() => import('views/pages/QuestDetails'));
const QuestsListPage = lazy(() => import('views/pages/QuestsList'));
const LaunchToken = lazy(() => import('views/pages/LaunchToken'));
const OverviewPage = lazy(() => import('views/pages/overview'));
const MembersPage = lazy(
  () =>
    import(
      'views/pages/CommunityGroupsAndMembers/Members/CommunityMembersPage'
    ),
);
const CreateMembersGroupPage = lazy(
  () => import('views/pages/CommunityGroupsAndMembers/Groups/Create'),
);
const UpdateMembersGroupPage = lazy(
  () => import('views/pages/CommunityGroupsAndMembers/Groups/Update'),
);
const DirectoryPage = lazy(() => import('views/pages/DirectoryPage'));
const FinishSocialLoginPage = lazy(
  () => import('views/pages/finish_social_login'),
);

const NotificationsPage = lazy(() => import('views/pages/notifications'));
const LeaderboardPage = lazy(() => import('views/pages/Leaderboard'));

const NotificationSettings = lazy(
  () => import('views/pages/NotificationSettings'),
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
const TopicRedirectPage = lazy(() => import('views/pages/topic_redirect'));
const ThreadRedirectPage = lazy(() => import('views/pages/thread_redirect'));
const CommentRedirectPage = lazy(() => import('views/pages/comment_redirect'));
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

const NewSnapshotProposalPage = lazy(
  () => import('views/pages/Snapshots/NewSnapshotProposal'),
);
const AdminPanelPage = lazy(() => import('views/pages/AdminPanel'));

const NewProfilePage = lazy(() => import('views/pages/new_profile'));
const EditNewProfilePage = lazy(() => import('views/pages/edit_new_profile'));
const ProfilePageRedirect = lazy(() => import('views/pages/profile_redirect'));
const CommunityNotFoundPage = lazy(
  () => import('views/pages/CommunityNotFoundPage'),
);

const UnSubscribePage = lazy(() => import('views/pages/UnSubscribePage'));
const RewardsPage = lazy(() => import('views/pages/RewardsPage'));
const CommunityHomePage = lazy(
  () => import('../views/pages/CommunityHome/CommunityHomePage'),
);
const GovernancePage = lazy(() => import('../views/pages/GovernancePage'));

const OnBoardingPage = lazy(() => import('../views/pages/OnBoarding'));

const newProposalViewPage = lazy(
  () => import('../views/pages/NewProposalViewPage'),
);

const CommonDomainRoutes = () => [
  <Route
    key="mobile-app-redirect"
    path="/_internal/mobile-app-redirect"
    element={<MobileAppRedirect />}
  />,

  <Route
    key="/_internal/quill"
    path="/_internal/quill"
    element={<QuillPage />}
  />,

  <Route
    key="/_internal/markdown-editor"
    path="/_internal/markdown-editor"
    element={<MarkdownEditorPage />}
  />,

  <Route
    key="/_internal/markdown-hit-highlighter"
    path="/_internal/markdown-hit-highlighter"
    element={<MarkdownHitHighlighterPage />}
  />,

  <Route
    key="/_internal/markdown-viewer"
    path="/_internal/markdown-viewer"
    element={<MarkdownViewerPage />}
  />,
  <Route key="/onboarding" path="/onboarding" element={<OnBoardingPage />} />,
  <Route
    key="/"
    path="/"
    element={withLayout(DashboardPage, { type: 'common' })}
  />,
  <Route
    key="/home"
    path="/home"
    element={withLayout(HomePage, { type: 'common' })}
  />,

  <Route
    key="/mobile-signin"
    path="/mobile-signin"
    element={withLayout(MobileSignIn, { type: 'common' })}
  />,

  <Route
    key="/createCommunity"
    path="/createCommunity"
    element={withLayout(CreateCommunityPage, { type: 'common' })}
  />,
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
  <Route
    key="/unSubscribe/:userId"
    path="/unSubscribe/:userId"
    element={withLayout(UnSubscribePage, { type: 'common' })}
  />,
  <Route
    key="/createTokenCommunity"
    path="/createTokenCommunity"
    element={withLayout(LaunchToken, { type: 'common' })}
  />,
  <Route
    key="/leaderboard"
    path="/leaderboard"
    element={withLayout(LeaderboardPage, { type: 'common' })}
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
    key="/explore"
    path="/explore"
    element={withLayout(CommunitiesPage, {
      type: 'common',
    })}
  />,
  <Route
    key="/rewards"
    path="/rewards"
    element={withLayout(RewardsPage, { type: 'common' })}
  />,
  <Route
    key="/search"
    path="/search"
    element={withLayout(SearchPage, { type: 'common' })}
  />,
  <Route
    key="/myTransactions"
    path="/myTransactions"
    element={withLayout(MyTransactions, { type: 'common' })}
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
    element={withLayout(NotificationSettings, { type: 'common' })}
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
    element={
      // redirect to proposal detail page
      <Navigate
        to={(parameters) =>
          `/${parameters.scope}/proposal-details/${parameters.identifier}?type=cosmos`
        }
      />
    }
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
  <Route
    key="/:scope/proposal-details/:identifier"
    path="/:scope/proposal-details/:identifier"
    element={withLayout(newProposalViewPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/governance"
    path="/:scope/governance"
    element={withLayout(GovernancePage, {
      scoped: true,
    })}
  />,
  // GOVERNANCE END

  // DISCUSSIONS
  <Route
    key="/:scope/community-home"
    path="/:scope/community-home"
    element={withLayout(CommunityHomePage, {
      scoped: true,
    })}
  />,
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
      renderDefaultMetatags: false,
    })}
  />,
  <Route
    key="/discussion/topic/:id"
    path="/discussion/topic/:id"
    element={withLayout(TopicRedirectPage, {
      scoped: false,
    })}
  />,
  <Route
    key="/discussion/:identifier"
    path="/discussion/:identifier"
    element={withLayout(ThreadRedirectPage, {
      scoped: false,
    })}
  />,
  <Route
    key="/discussion/comment/:identifier"
    path="/discussion/comment/:identifier"
    element={withLayout(CommentRedirectPage, {
      scoped: false,
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
    key="/new/discussion"
    path="/new/discussion"
    element={withLayout(NewThreadPage, {
      scoped: false,
      type: 'common',
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
  <Route
    key={0}
    path="/:scope/archived"
    element={withLayout(DiscussionsPage, {
      scoped: true,
    })}
  />,
  // DISCUSSIONS END

  // SITE ADMIN
  <Route
    key="/admin-panel"
    path="/admin-panel"
    element={withLayout(AdminPanelPage, { type: 'common' })}
  />,

  // ADMIN
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
    key="/:scope/manage/integrations/stake"
    path="/:scope/manage/integrations/stake"
    element={withLayout(CommunityStakeIntegration, {
      scoped: true,
    })}
  />,

  <Route
    key="/:scope/manage/integrations/token"
    path="/:scope/manage/integrations/token"
    element={withLayout(CommunityTokenIntegration, {
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
  <Route
    key="/:scope/manage/contests"
    path="/:scope/manage/contests"
    element={withLayout(AdminContestsPage, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/manage/contests/launch"
    path="/:scope/manage/contests/launch"
    element={withLayout(ManageContest, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/manage/contests/:contestAddress"
    path="/:scope/manage/contests/:contestAddress"
    element={withLayout(ManageContest, {
      scoped: true,
    })}
  />,
  <Route
    key="/:scope/contests"
    path="/:scope/contests"
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
    // redirect to proposal detail page
    element={
      <Navigate
        to={(parameters) =>
          // eslint-disable-next-line max-len
          `/${parameters.scope}/proposal-details/${parameters.identifier}?snapshotId=${parameters.snapshotId}&type=snapshot`
        }
      />
    }
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
  <Route
    key="/:scope/home"
    path="/:scope/home"
    element={<Navigate to={(parameters) => `/${parameters.scope}/`} />}
  />,
  // LEGACY REDIRECTS END

  // Community not found page - This should be at the end
  <Route
    key="/:scope/*"
    path="/:scope/*"
    element={withLayout(CommunityNotFoundPage, {
      scoped: true,
    })}
  />,
];

export default CommonDomainRoutes;
