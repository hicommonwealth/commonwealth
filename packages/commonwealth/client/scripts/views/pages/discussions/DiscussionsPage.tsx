import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';

import useBrowserWindow from 'hooks/useBrowserWindow';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { getProposalUrlPath } from 'identifiers';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import { useDateCursor } from 'state/api/threads/fetchThreads';
import useEXCEPTION_CASE_threadCountersStore from 'state/ui/thread';
import { slugify } from 'utils';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import Thread from '../../../models/Thread';
import {
  ThreadFeaturedFilterTypes,
  ThreadTimelineFilterTypes,
} from '../../../models/types';
import app from '../../../state';
import { useFetchTopicsQuery } from '../../../state/api/topics';
import { trpc } from '../../../utils/trpcClient';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { HeaderWithFilters } from './HeaderWithFilters';
import { ThreadCard } from './ThreadCard';
import { sortByFeaturedFilter, sortPinned } from './helpers';

import { getThreadActionTooltipText } from 'helpers/threads';
import 'pages/discussions/index.scss';
import { useRefreshMembershipQuery } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import { EmptyThreadsPlaceholder } from './EmptyThreadsPlaceholder';

type DiscussionsPageProps = {
  topicName?: string;
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const community_id = app.activeChainId();
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
    communityId: community_id,
  });
  const [resizing, setResizing] = useState(false);
  const { isWindowSmallInclusive } = useBrowserWindow({
    onResize: () => setResizing(true),
    resizeListenerUpdateDeps: [resizing],
  });

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const topicId = (topics || []).find(({ name }) => name === topicName)?.id;

  const { data: memberships = [] } = useRefreshMembershipQuery({
    chainId: community_id,
    address: app?.user?.activeAccount?.address,
    apiEnabled: !!app?.user?.activeAccount?.address,
  });

  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { dateCursor } = useDateCursor({
    dateRange: searchParams.get('dateRange') as ThreadTimelineFilterTypes,
  });

  const isOnArchivePage = location.pathname === `/${community_id}/archived`;

  const { fetchNextPage, data, isInitialLoading, hasNextPage } =
    trpc.thread.getBulkThreads.useInfiniteQuery(
      {
        community_id,
        queryType: 'bulk',
        limit: 20,
        topicId,
        stage: stageName,
        includePinnedThreads: true,
        orderBy: featuredFilter,
        toDate: dateCursor.toDate,
        fromDate: dateCursor.fromDate,
        isOnArchivePage: isOnArchivePage,
      },
      {
        getNextPageParam: (lastPage) => {
          return lastPage.cursor + 1;
        },
        initialCursor: 1,
      },
    );

  console.log(data?.pages?.length, 'length');
  console.log(fetchNextPage, 'length');
  const threadData = data?.pages.flatMap((page) =>
    page.threads.map((t) => new Thread(t as any)),
  );

  const threads = sortPinned(
    sortByFeaturedFilter(threadData || [], featuredFilter),
  );
  //
  //Checks if the current page is a discussion page and if the window is small enough to render the mobile menu
  //Checks both for mobile device and inner window size for desktop responsiveness
  const filteredThreads = threads.filter((t) => {
    if (!includeSpamThreads && t.markedAsSpamAt) return null;

    if (!isOnArchivePage && !includeArchivedThreads && t.archivedAt)
      return null;

    if (isOnArchivePage && t.archivedAt) return null;

    return t;
  });

  useManageDocumentTitle('Discussions');

  return (
    <div className="DiscussionsPage">
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

                localStorage[`${community_id}-discussions-scrollY`] =
                  scrollEle.scrollTop;
              }}
              onCommentBtnClick={() =>
                navigate(`${discussionLink}?focusEditor=true`)
              }
              disabledActionsTooltipText={disabledActionsTooltipText}
            />
          );
        }}
        endReached={() => hasNextPage && fetchNextPage()}
        overscan={200}
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
              {isWindowSmallInclusive && (
                <div className="mobileBreadcrumbs">
                  <Breadcrumbs />
                </div>
              )}
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
    </div>
  );
};

export default DiscussionsPage;
