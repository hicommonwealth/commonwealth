import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';

import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { getProposalUrlPath } from 'identifiers';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import useFetchThreadsQuery, {
  useDateCursor,
} from 'state/api/threads/fetchThreads';
import useEXCEPTION_CASE_threadCountersStore from 'state/ui/thread';
import {
  ThreadFeaturedFilterTypes,
  ThreadTimelineFilterTypes,
} from '../../../models/types';
import app from '../../../state';
import { useFetchTopicsQuery } from '../../../state/api/topics';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { HeaderWithFilters } from './HeaderWithFilters';
import { ThreadCard } from './ThreadCard';
import { sortByFeaturedFilter, sortPinned } from './helpers';

import { slugify } from '@hicommonwealth/shared';
import { getThreadActionTooltipText } from 'helpers/threads';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import useManageDocumentTitle from 'hooks/useManageDocumentTitle';
import 'pages/discussions/index.scss';
import { useRefreshMembershipQuery } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { AdminOnboardingSlider } from '../../components/AdminOnboardingSlider';
import { UserTrainingSlider } from '../../components/UserTrainingSlider';
import { DiscussionsFeedDiscovery } from './DiscussionsFeedDiscovery';
import { EmptyThreadsPlaceholder } from './EmptyThreadsPlaceholder';

type DiscussionsPageProps = {
  topicName?: string;
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const userOnboardingEnabled = useFlag('userOnboardingEnabled');
  const communityId = app.activeChainId();
  const navigate = useCommonNavigate();
  const { totalThreadsInCommunity } = useEXCEPTION_CASE_threadCountersStore();
  const [includeSpamThreads, setIncludeSpamThreads] = useState<boolean>(false);
  const [includeArchivedThreads, setIncludeArchivedThreads] =
    useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const stageName: string = searchParams.get('stage');
  const featuredFilter: ThreadFeaturedFilterTypes = searchParams.get(
    'featured',
  ) as ThreadFeaturedFilterTypes;
  const dateRange: ThreadTimelineFilterTypes = searchParams.get(
    'dateRange',
  ) as ThreadTimelineFilterTypes;
  const { data: topics } = useFetchTopicsQuery({
    communityId,
  });
  const contestAddress = searchParams.get('contest');
  const contestStatus = searchParams.get('status');

  const containerRef = useRef();

  useBrowserWindow({});

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const topicId = (topics || []).find(({ name }) => name === topicName)?.id;

  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId: communityId,
    address: app?.user?.activeAccount?.address,
    apiEnabled: !!app?.user?.activeAccount?.address,
  });

  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { dateCursor } = useDateCursor({
    dateRange: searchParams.get('dateRange') as ThreadTimelineFilterTypes,
  });

  const isOnArchivePage =
    location.pathname ===
    (app.isCustomDomain() ? `/archived` : `/${app.activeChainId()}/archived`);

  const { fetchNextPage, data, isInitialLoading, hasNextPage } =
    useFetchThreadsQuery({
      communityId: app.activeChainId(),
      queryType: 'bulk',
      page: 1,
      limit: 20,
      topicId,
      stage: stageName ?? undefined,
      includePinnedThreads: true,
      ...(featuredFilter && {
        orderBy: featuredFilter,
      }),
      toDate: dateCursor.toDate,
      fromDate: dateCursor.fromDate,
      isOnArchivePage: isOnArchivePage,
      contestAddress,
      contestStatus,
    });

  const threads = sortPinned(sortByFeaturedFilter(data || [], featuredFilter));

  // Checks if the current page is a discussion page and if the window is small enough to render the mobile menu
  // Checks both for mobile device and inner window size for desktop responsiveness
  const filteredThreads = threads.filter((t) => {
    if (!includeSpamThreads && t.markedAsSpamAt) return null;

    if (!isOnArchivePage && !includeArchivedThreads && t.archivedAt)
      return null;

    if (isOnArchivePage && !t.archivedAt) return null;

    return t;
  });

  useManageDocumentTitle('Discussions');

  return (
    <CWPageLayout ref={containerRef} className="DiscussionsPageLayout">
      <DiscussionsFeedDiscovery
        orderBy={featuredFilter}
        community={communityId}
        includePinnedThreads={true}
      />
      <Virtuoso
        className="thread-list"
        style={{ height: '100%', width: '100%' }}
        data={isInitialLoading ? [] : filteredThreads}
        itemContent={(i, thread) => {
          const discussionLink = getProposalUrlPath(
            thread.slug,
            `${thread.identifier}-${slugify(thread.title)}`,
          );

          const isTopicGated = !!(memberships || []).find((membership) =>
            membership.topicIds.includes(thread?.topic?.id),
          );

          const isActionAllowedInGatedTopic = !!(memberships || []).find(
            (membership) =>
              membership.topicIds.includes(thread?.topic?.id) &&
              membership.isAllowed,
          );

          const isRestrictedMembership =
            !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

          const disabledActionsTooltipText = getThreadActionTooltipText({
            isCommunityMember: !!hasJoinedCommunity,
            isThreadArchived: !!thread?.archivedAt,
            isThreadLocked: !!thread?.lockedAt,
            isThreadTopicGated: isRestrictedMembership,
          });

          return (
            <ThreadCard
              key={thread?.id + '-' + thread.readOnly}
              thread={thread}
              canReact={!disabledActionsTooltipText}
              canComment={!disabledActionsTooltipText}
              onEditStart={() => navigate(`${discussionLink}`)}
              onStageTagClick={() => {
                navigate(`/discussions?stage=${thread.stage}`);
              }}
              threadHref={`${getScopePrefix()}${discussionLink}`}
              onBodyClick={() => {
                const scrollEle = document.getElementsByClassName('Body')[0];

                localStorage[`${communityId}-discussions-scrollY`] =
                  scrollEle.scrollTop;
              }}
              onCommentBtnClick={() =>
                navigate(`${discussionLink}?focusEditor=true`)
              }
              disabledActionsTooltipText={disabledActionsTooltipText}
            />
          );
        }}
        endReached={() => {
          hasNextPage && fetchNextPage();
        }}
        overscan={50}
        components={{
          // eslint-disable-next-line react/no-multi-comp
          EmptyPlaceholder: () => (
            <EmptyThreadsPlaceholder
              isInitialLoading={isInitialLoading}
              isOnArchivePage={isOnArchivePage}
            />
          ),
          // eslint-disable-next-line react/no-multi-comp
          Header: () => (
            <>
              <Breadcrumbs />
              {userOnboardingEnabled && <UserTrainingSlider />}
              <AdminOnboardingSlider />
              <HeaderWithFilters
                topic={topicName}
                stage={stageName}
                featuredFilter={featuredFilter}
                dateRange={dateRange}
                totalThreadCount={
                  isOnArchivePage
                    ? filteredThreads.length || 0
                    : threads
                    ? totalThreadsInCommunity
                    : 0
                }
                isIncludingSpamThreads={includeSpamThreads}
                onIncludeSpamThreads={setIncludeSpamThreads}
                isIncludingArchivedThreads={includeArchivedThreads}
                onIncludeArchivedThreads={setIncludeArchivedThreads}
                isOnArchivePage={isOnArchivePage}
              />
            </>
          ),
        }}
      />
    </CWPageLayout>
  );
};

export default DiscussionsPage;
