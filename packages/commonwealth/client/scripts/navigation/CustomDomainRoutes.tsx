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

const ReferendaPage = lazy(() => import('views/pages/referenda'));
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

const CustomDomainRoutes = () => {
  return [
    <Route
      path="/"
      element={withLayout(DiscussionsRedirectPage, {
        scoped: true,
        deferChain: true,
      })}
    />,
    <Route
      path="/createCommunity"
      element={withLayout(CreateCommunityPage, { scoped: true })}
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
    <Route
      path="/finishsociallogin"
      element={withLayout(FinishSocialLoginPage, {})}
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
        scoped: true,
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

        deferChain: true,
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
    ...(featureFlags.proposalTemplates
      ? [
          <Route
            path="/contracts"
            element={withLayout(ContractsPage, {
              scoped: true,

              deferChain: true,
            })}
          />,
          <Route
            path="/new/contract"
            element={withLayout(NewContractPage, {
              scoped: true,

              deferChain: true,
            })}
          />,
          <Route
            path="/new/contract_template/:contract_id"
            element={withLayout(NewContractTemplatePage, {
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
          <Route
            path="/:contract_address/:slug"
            element={withLayout(ViewTemplatePage, {
              scoped: true,
            })}
          />,
        ]
      : []),
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
    <Route
      path="/manage"
      element={withLayout(ManageCommunityPage, {
        scoped: true,

        deferChain: true,
      })}
    />,
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
      path="/profile/edit"
      element={withLayout(EditNewProfilePage, {
        scoped: true,

        deferChain: true,
      })}
    />,
    // PROFILES END

    // REDIRECTS //
    <Route path="/:scope/home" element={<Navigate to="/overview" />} />,
    <Route path="/:scope/search" element={<Navigate to="/search" />} />,
    <Route path="/:scope/web3login" element={<Navigate to="/web3login" />} />,
    <Route path="/:scope/overview" element={<Navigate to="/overview" />} />,
    <Route path="/:scope/members" element={<Navigate to="/members" />} />,
    <Route
      path="/:scope/sputnik-daos"
      element={<Navigate to="/sputnik-daos" />}
    />,
    <Route
      path="/:scope/finishNearLogin"
      element={<Navigate to="/finishNearLogin" />}
    />,
    <Route
      path="/:scope/finishaxielogin"
      element={<Navigate to="/finishaxielogin" />}
    />,
    <Route
      path="/:scope/finishsociallogin"
      element={<Navigate to="/finishsociallogin" />}
    />,

    // NOTIFICATIONS
    <Route
      path="/:scope/notifications"
      element={<Navigate to="/notifications" />}
    />,
    <Route
      path="/:scope/notification-settings"
      element={<Navigate to="/notification-settings" />}
    />,
    // NOTIFICATIONS END

    // GOVERNANCE
    <Route path="/:scope/referenda" element={<Navigate to="/referenda" />} />,
    <Route path="/:scope/proposals" element={<Navigate to="/proposals" />} />,
    <Route
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
      path="/:scope/proposal/:identifier"
      element={
        <Navigate to={(parameters) => `/proposal/${parameters.identifier}`} />
      }
    />,
    <Route
      path="/:scope/new/proposal/:type"
      element={
        <Navigate to={(parameters) => `/new/proposal/${parameters.type}`} />
      }
    />,
    <Route
      path="/:scope/new/proposal"
      element={<Navigate to="/new/proposal" />}
    />,
    // GOVERNANCE END

    // DISCUSSIONS
    <Route
      path="/:scope/discussions"
      element={<Navigate to="/discussions" />}
    />,
    <Route
      path="/:scope/discussions/:topicName"
      element={
        <Navigate to={(parameters) => `/discussions/${parameters.topicName}`} />
      }
    />,
    <Route
      path="/:scope/discussion/:identifier"
      element={
        <Navigate to={(parameters) => `/discussion/${parameters.identifier}`} />
      }
    />,
    <Route
      path="/:scope/new/discussion"
      element={<Navigate to="/new/discussion" />}
    />,
    <Route
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
      path="/:scope/new/contract"
      element={<Navigate to="/new/contract" />}
    />,
    <Route
      path="/:scope/contract/:contractAddress"
      element={
        <Navigate
          to={(parameters) => `/contract/${parameters.contractAddress}`}
        />
      }
    />,
    // CONTRACTS END

    // TREASURY
    <Route path="/:scope/treasury" element={<Navigate to="/treasury" />} />,
    <Route path="/:scope/tips" element={<Navigate to="/tips" />} />,
    // TREASURY END

    // ADMIN
    <Route path="/:scope/manage" element={<Navigate to="/manage" />} />,
    <Route path="/:scope/analytics" element={<Navigate to="/analytics" />} />,
    <Route
      path="/:scope/snapshot/:snapshotId"
      element={
        <Navigate to={(parameters) => `/snapshot/${parameters.snapshotId}`} />
      }
    />,
    <Route
      path="/:scope/multiple-snapshots"
      element={<Navigate to="/multiple-snapshots" />}
    />,
    <Route
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
      path="/:scope/account/:address"
      element={<Navigate to="/account/:address" />}
    />,
    <Route path="/:scope/account" element={<Navigate to="/account" />} />,
    <Route
      path="/:scope/profile/id/:profileId"
      element={
        <Navigate to={(parameters) => `/profile/id/${parameters.profileId}`} />
      }
    />,
    <Route
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
      path="/link/chain-entity/:identifier"
      element={withLayout(ChainEntityLinkRedirectPage, {
        scoped: true,

        deferChain: true,
      })}
    />,
    <Route
      path="/link/snapshot-proposal/:identifier"
      element={withLayout(SnapshotProposalLinkRedirectPage, {
        scoped: true,

        deferChain: true,
      })}
    />,
  ];
};

export default CustomDomainRoutes;
