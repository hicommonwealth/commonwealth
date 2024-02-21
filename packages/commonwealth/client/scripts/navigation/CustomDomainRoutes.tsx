import { Navigate } from 'navigation/helpers';
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withLayout } from 'views/Layout';
import { RouteFeatureFlags } from './Router';

const SearchPage = lazy(() => import('views/pages/search'));

const CreateCommunityPage = lazy(() => import('views/pages/CreateCommunity'));
const OverviewPage = lazy(() => import('views/pages/overview'));
const MembersPage = lazy(
  () => import('views/pages/Community/Members/CommunityMembersPage'),
);
const DirectoryPage = lazy(() => import('views/pages/DirectoryPage'));
const CreateMembersGroupPage = lazy(
  () => import('views/pages/Community/Groups/Create'),
);
const UpdateMembersGroupPage = lazy(
  () => import('views/pages/Community/Groups/Update'),
);
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
  () => import('views/pages/view_thread/ViewThreadPage'),
);
const NewThreadPage = lazy(() => import('views/pages/new_thread'));
const DiscussionsRedirectPage = lazy(
  () => import('views/pages/discussions_redirect'),
);
const SnapshotProposalLinkRedirectPage = lazy(
  () => import('views/pages/snapshot_proposal_link_redirect'),
);

const ContractsPage = lazy(() => import('views/pages/contracts'));
const NewContractPage = lazy(() => import('views/pages/new_contract'));
const GeneralContractPage = lazy(() => import('views/pages/general_contract'));
const NewContractTemplatePage = lazy(
  () => import('views/pages/new_contract_template'),
);
const ViewTemplatePage = lazy(() => import('views/pages/view_template'));

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
  () => import('views/pages/new_snapshot_proposal'),
);

const NewProfilePage = lazy(() => import('views/pages/new_profile'));
const EditNewProfilePage = lazy(() => import('views/pages/edit_new_profile'));
const ProfilePageRedirect = lazy(() => import('views/pages/profile_redirect'));

const CustomDomainRoutes = ({
  proposalTemplatesEnabled,
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
    <Route key="/home" path="/home" element={<Navigate to="/overview" />} />,
    <Route
      key="/search"
      path="/search"
      element={withLayout(SearchPage, { type: 'common' })}
    />,
    <Route key="/web3login" path="/web3login" element={<Navigate to="/" />} />,
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
      key="/sputnik-daos"
      path="/sputnik-daos"
      element={withLayout(SputnikDaosPage, {
        scoped: true,
      })}
    />,
    <Route
      key="/finishNearLogin"
      path="/finishNearLogin"
      element={withLayout(FinishNearLoginPage, {
        scoped: true,
        type: 'common',
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
      element={withLayout(NotificationSettingsPage, {
        scoped: true,
        type: 'common',
      })}
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

    // CONTRACTS
    ...(proposalTemplatesEnabled
      ? [
          <Route
            key="/contracts"
            path="/contracts"
            element={withLayout(ContractsPage, {
              scoped: true,
            })}
          />,
          <Route
            key="/new/contract"
            path="/new/contract"
            element={withLayout(NewContractPage, {
              scoped: true,
            })}
          />,
          <Route
            key="/new/contract_template/:contract_id"
            path="/new/contract_template/:contract_id"
            element={withLayout(NewContractTemplatePage, {
              scoped: true,
            })}
          />,
          <Route
            key="/contract/:contractAddress"
            path="/contract/:contractAddress"
            element={withLayout(GeneralContractPage, {
              scoped: true,
            })}
          />,
          <Route
            key="/:contract_address/:slug"
            path="/:contract_address/:slug"
            element={withLayout(ViewTemplatePage, {
              scoped: true,
            })}
          />,
        ]
      : []),
    // CONTRACTS END

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
      key="/:scope/web3login"
      path="/:scope/web3login"
      element={<Navigate to="/web3login" />}
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
      key="/:scope/sputnik-daos"
      path="/:scope/sputnik-daos"
      element={<Navigate to="/sputnik-daos" />}
    />,
    <Route
      key="/:scope/finishNearLogin"
      path="/:scope/finishNearLogin"
      element={<Navigate to="/finishNearLogin" />}
    />,
    <Route
      key="/:scope/finishaxielogin"
      path="/:scope/finishaxielogin"
      element={<Navigate to="/finishaxielogin" />}
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

    // CONTRACTS
    <Route
      key="/:scope/new/contract"
      path="/:scope/new/contract"
      element={<Navigate to="/new/contract" />}
    />,
    <Route
      key="/:scope/contract/:contractAddress"
      path="/:scope/contract/:contractAddress"
      element={
        <Navigate
          to={(parameters) => `/contract/${parameters.contractAddress}`}
        />
      }
    />,
    // CONTRACTS END

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
      key="/:scope/profile/id/:profileId"
      path="/:scope/profile/id/:profileId"
      element={
        <Navigate to={(parameters) => `/profile/id/${parameters.profileId}`} />
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
