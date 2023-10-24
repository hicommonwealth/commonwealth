import { featureFlags } from 'helpers/feature-flags';
import { Navigate } from 'navigation/helpers';
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withLayout } from 'views/Layout';

const SearchPage = lazy(() => import('views/pages/search'));

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

const ProposalsPage = lazy(() => import('views/pages/proposals'));
const ViewProposalPage = lazy(() => import('views/pages/view_proposal/index'));
const NewProposalPage = lazy(() => import('views/pages/new_proposal/index'));

const DiscussionsPage = lazy(
  () => import('views/pages/discussions/DiscussionsPage')
);
const ViewThreadPage = lazy(
  () => import('views/pages/view_thread/ViewThreadPage')
);
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

const ContractsPage = lazy(() => import('views/pages/contracts'));
const NewContractPage = lazy(() => import('views/pages/new_contract'));
const GeneralContractPage = lazy(() => import('views/pages/general_contract'));
const NewContractTemplatePage = lazy(
  () => import('views/pages/new_contract_template')
);
const ViewTemplatePage = lazy(() => import('views/pages/view_template'));

const ManageCommunityPage = lazy(
  () => import('views/pages/manage_community/ManageCommunityPage')
);
const DiscordCallbackPage = lazy(
  () => import('views/pages/manage_community/discord-callback')
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

const CustomDomainRoutes = () => {
  return [
    <Route
      key={0}
      path="/"
      element={withLayout(DiscussionsRedirectPage, {
        scoped: true,
        type: 'blank',
      })}
    />,
    <Route
      key={0}
      path="/createCommunity"
      element={withLayout(CreateCommunityPage, {
        scoped: true,
        type: 'common',
      })}
    />,
    <Route
      key={0}
      path="/createCommunity/:type"
      element={withLayout(CreateCommunityPage, {
        scoped: true,
        type: 'common',
      })}
    />,
    <Route key={0} path="/home" element={<Navigate to="/overview" />} />,
    <Route
      key={0}
      path="/search"
      element={withLayout(SearchPage, { type: 'common' })}
    />,
    <Route key={0} path="/web3login" element={<Navigate to="/" />} />,
    <Route
      key={0}
      path="/overview"
      element={withLayout(OverviewPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/members"
      element={withLayout(MembersPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/sputnik-daos"
      element={withLayout(SputnikDaosPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/finishNearLogin"
      element={withLayout(FinishNearLoginPage, {
        scoped: true,
        type: 'common',
      })}
    />,
    <Route
      key={0}
      path="/finishaxielogin"
      element={withLayout(FinishAxieLoginPage, { type: 'common' })}
    />,
    <Route
      key={0}
      path="/finishsociallogin"
      element={withLayout(FinishSocialLoginPage, { type: 'common' })}
    />,

    // NOTIFICATIONS
    <Route
      key={0}
      path="/notifications"
      element={withLayout(NotificationsPage, {
        scoped: true,
        type: 'common',
      })}
    />,

    <Route
      key={0}
      path="/notification-settings"
      element={withLayout(NotificationSettingsPage, {
        scoped: true,
        type: 'common',
      })}
    />,
    // NOTIFICATIONS END

    // GOVERNANCE
    <Route
      key={0}
      path="/proposals"
      element={withLayout(ProposalsPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/proposal/:type/:identifier"
      element={withLayout(ViewProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/proposal/:identifier"
      element={withLayout(ViewProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/new/proposal/:type"
      element={withLayout(NewProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/new/proposal"
      element={withLayout(NewProposalPage, {
        scoped: true,
      })}
    />,
    // GOVERNANCE END

    // DISCUSSIONS
    <Route
      key={0}
      path="/discussions"
      element={withLayout(DiscussionsPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/discussions/:topicName"
      element={withLayout(DiscussionsPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/discussion/:identifier"
      element={withLayout(ViewThreadPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/new/discussion"
      element={withLayout(NewThreadPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
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
    ...(featureFlags.proposalTemplates
      ? [
          <Route
            key={0}
            path="/contracts"
            element={withLayout(ContractsPage, {
              scoped: true,
            })}
          />,
          <Route
            key={0}
            path="/new/contract"
            element={withLayout(NewContractPage, {
              scoped: true,
            })}
          />,
          <Route
            key={0}
            path="/new/contract_template/:contract_id"
            element={withLayout(NewContractTemplatePage, {
              scoped: true,
            })}
          />,
          <Route
            key={0}
            path="/contract/:contractAddress"
            element={withLayout(GeneralContractPage, {
              scoped: true,
            })}
          />,
          <Route
            key={0}
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
      key={0}
      path="/manage"
      element={withLayout(ManageCommunityPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/discord-callback"
      element={withLayout(DiscordCallbackPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/analytics"
      element={withLayout(AnalyticsPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/snapshot/:snapshotId"
      element={withLayout(SnapshotProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/multiple-snapshots"
      element={withLayout(ViewMultipleSnapshotsPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/snapshot/:snapshotId/:identifier"
      element={withLayout(ViewSnapshotsProposalPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/new/snapshot/:snapshotId"
      element={withLayout(NewSnapshotProposalPage, {
        scoped: true,
      })}
    />,
    // ADMIN END

    // PROFILES
    <Route
      key={0}
      path="/account/:address"
      element={withLayout(ProfilePageRedirect, {
        scoped: true,
        type: 'common',
      })}
    />,
    <Route
      key={0}
      path="/account"
      element={withLayout(ProfilePageRedirect, {
        scoped: true,
        type: 'common',
      })}
    />,
    <Route
      key={0}
      path="/profile/id/:profileId"
      element={withLayout(NewProfilePage, {
        scoped: true,
        type: 'common',
      })}
    />,
    <Route
      key={0}
      path="/profile/edit"
      element={withLayout(EditNewProfilePage, {
        scoped: true,
        type: 'common',
      })}
    />,
    // PROFILES END

    // REDIRECTS //
    <Route key={0} path="/:scope/home" element={<Navigate to="/overview" />} />,
    <Route key={0} path="/:scope/search" element={<Navigate to="/search" />} />,
    <Route
      key={0}
      path="/:scope/web3login"
      element={<Navigate to="/web3login" />}
    />,
    <Route
      key={0}
      path="/:scope/overview"
      element={<Navigate to="/overview" />}
    />,
    <Route
      key={0}
      path="/:scope/members"
      element={<Navigate to="/members" />}
    />,
    <Route
      key={0}
      path="/:scope/sputnik-daos"
      element={<Navigate to="/sputnik-daos" />}
    />,
    <Route
      key={0}
      path="/:scope/finishNearLogin"
      element={<Navigate to="/finishNearLogin" />}
    />,
    <Route
      key={0}
      path="/:scope/finishaxielogin"
      element={<Navigate to="/finishaxielogin" />}
    />,
    <Route
      key={0}
      path="/:scope/finishsociallogin"
      element={<Navigate to="/finishsociallogin" />}
    />,

    // NOTIFICATIONS
    <Route
      key={0}
      path="/:scope/notifications"
      element={<Navigate to="/notifications" />}
    />,
    <Route
      key={0}
      path="/:scope/notification-settings"
      element={<Navigate to="/notification-settings" />}
    />,
    // NOTIFICATIONS END

    // GOVERNANCE
    <Route
      key={0}
      path="/:scope/referenda"
      element={<Navigate to="/referenda" />}
    />,
    <Route
      key={0}
      path="/:scope/proposals"
      element={<Navigate to="/proposals" />}
    />,
    <Route
      key={0}
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
      key={0}
      path="/:scope/proposal/:identifier"
      element={
        <Navigate to={(parameters) => `/proposal/${parameters.identifier}`} />
      }
    />,
    <Route
      key={0}
      path="/:scope/new/proposal/:type"
      element={
        <Navigate to={(parameters) => `/new/proposal/${parameters.type}`} />
      }
    />,
    <Route
      key={0}
      path="/:scope/new/proposal"
      element={<Navigate to="/new/proposal" />}
    />,
    // GOVERNANCE END

    // DISCUSSIONS
    <Route
      key={0}
      path="/:scope/discussions"
      element={<Navigate to="/discussions" />}
    />,
    <Route
      key={0}
      path="/:scope/discussions/:topicName"
      element={
        <Navigate to={(parameters) => `/discussions/${parameters.topicName}`} />
      }
    />,
    <Route
      key={0}
      path="/:scope/discussion/:identifier"
      element={
        <Navigate to={(parameters) => `/discussion/${parameters.identifier}`} />
      }
    />,
    <Route
      key={0}
      path="/:scope/new/discussion"
      element={<Navigate to="/new/discussion" />}
    />,
    <Route
      key={0}
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
      key={0}
      path="/:scope/new/contract"
      element={<Navigate to="/new/contract" />}
    />,
    <Route
      key={0}
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
      key={0}
      path="/:scope/treasury"
      element={<Navigate to="/treasury" />}
    />,
    <Route key={0} path="/:scope/tips" element={<Navigate to="/tips" />} />,
    // TREASURY END

    // ADMIN
    <Route key={0} path="/:scope/manage" element={<Navigate to="/manage" />} />,
    <Route
      key={0}
      path="/:scope/analytics"
      element={<Navigate to="/analytics" />}
    />,
    <Route
      key={0}
      path="/:scope/snapshot/:snapshotId"
      element={
        <Navigate to={(parameters) => `/snapshot/${parameters.snapshotId}`} />
      }
    />,
    <Route
      key={0}
      path="/:scope/multiple-snapshots"
      element={<Navigate to="/multiple-snapshots" />}
    />,
    <Route
      key={0}
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
      key={0}
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
      key={0}
      path="/:scope/account/:address"
      element={<Navigate to="/account/:address" />}
    />,
    <Route
      key={0}
      path="/:scope/account"
      element={<Navigate to="/account" />}
    />,
    <Route
      key={0}
      path="/:scope/profile/id/:profileId"
      element={
        <Navigate to={(parameters) => `/profile/id/${parameters.profileId}`} />
      }
    />,
    <Route
      key={0}
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
      key={0}
      path="/link/chain-entity/:identifier"
      element={withLayout(ChainEntityLinkRedirectPage, {
        scoped: true,
      })}
    />,
    <Route
      key={0}
      path="/link/snapshot-proposal/:identifier"
      element={withLayout(SnapshotProposalLinkRedirectPage, {
        scoped: true,
      })}
    />,
  ];
};

export default CustomDomainRoutes;
