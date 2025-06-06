import useGetThreadByIdQuery from 'client/scripts/state/api/threads/getThreadById';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import app from 'state';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { useCosmosProposal } from '../../pages/NewProposalViewPage/useCosmosProposal';
import { useSnapshotProposal } from '../../pages/NewProposalViewPage/useSnapshotProposal';
import { CWBreadcrumbs } from '../component_kit/cw_breadcrumbs';
import './Breadcrumbs.scss';
import { breadCrumbURLS } from './data';
import { generateBreadcrumbs } from './utils';

export const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useCommonNavigate();
  const userData = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();
  const [searchParams] = useSearchParams();
  const getProposalPath = location.pathname.match(/\/proposal-details\/(.+)$/);
  const identifier = getProposalPath ? getProposalPath[1] : null;
  const queryType = searchParams.get('type');
  const querySnapshotId = searchParams.get('snapshotId');

  const proposalId = identifier
    ? queryType === 'cosmos'
      ? identifier.split('-')[0]
      : identifier
    : null;

  const { proposal: snapshotProposal } = useSnapshotProposal({
    identifier: proposalId || '',
    snapshotId: querySnapshotId || '',
    enabled: !!(queryType === 'snapshot' && querySnapshotId),
  });

  const { title: proposalTitle } = useCosmosProposal({
    proposalId: proposalId || '',
    enabled: !!(proposalId && queryType === 'cosmos'),
  });

  const currentProposalTitle = snapshotProposal?.title || proposalTitle;

  const getThreadId = location.pathname.match(/\/(\d+)-/);
  const thread_id = getThreadId ? Number(getThreadId[1]) : undefined;

  const communityId = app.activeChainId() || '';

  const { data: linkedThread } = useGetThreadByIdQuery(
    thread_id!,
    // Only call when in discussion pages prevents unnecessary calls.
    !!thread_id &&
      location.pathname.split('/')[1].toLowerCase() === 'discussion' &&
      !!communityId,
  );

  const currentDiscussion = {
    currentThreadName: linkedThread?.title || '',
    currentTopic: linkedThread?.topic?.name || '',
    topicURL: communityId
      ? `/${communityId}/discussions/${encodeURI(
          linkedThread?.topic?.name || '',
        )}`
      : `/discussions/${encodeURI(linkedThread?.topic?.name || '')}` || '',
  };

  let standalone = false;

  /**
   * An array of paths that are considered standalone pages.
   */
  const standalonePaths = [
    'explore',
    'dashboard',
    'notifications',
    'notification-settings',
    'createCommunity',
  ];

  //Checks if the current page is a standalone page or if it contains the /profile/id.
  if (
    standalonePaths.includes(location.pathname.split('/')[1]) ||
    location.pathname.includes('/profile/id')
  ) {
    standalone = true;
  }

  const user = userData.addresses?.[0];

  const pathnames = generateBreadcrumbs(
    location.pathname,
    navigate,
    domain?.isCustomDomain ? communityId : '',
    currentDiscussion,
    user?.userId,
    currentProposalTitle,
  );

  //Gets the tooltip copy based on the current page.
  const getToolTipCopy = () => {
    const lastPathSegment = location.pathname.split('/').pop();

    const tooltips = {
      admin: 'This is a section, not a selectable page.',
      discussionsGovernance: 'This is an app, not a selectable page.',
    };

    const isAdminOrGovernance = breadCrumbURLS.find(
      (breadcrumbItem) =>
        breadcrumbItem.url === lastPathSegment &&
        (breadcrumbItem.isAdmin || breadcrumbItem.isGovernance),
    );

    return isAdminOrGovernance
      ? tooltips[
          isAdminOrGovernance.isAdmin ? 'admin' : 'discussionsGovernance'
        ]
      : undefined;
  };

  return (
    <CWPageLayout className="BreadcrumbsPageLayout">
      <nav className="BreadcrumbsComponent">
        {standalone ? (
          <CWBreadcrumbs breadcrumbs={[pathnames[0]]} />
        ) : (
          <CWBreadcrumbs
            breadcrumbs={pathnames}
            tooltipStr={
              getToolTipCopy() || 'This is an app, not a selectable page.'
            }
          />
        )}
      </nav>
      {/* an empty div that takes the block content area on the active page, similar
      to the area that the fixed position BreadcrumbsComponent would take */}
      <div className="BreadcrumbsBlockContentArea" />
    </CWPageLayout>
  );
};
