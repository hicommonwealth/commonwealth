import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';

import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { getProposalUrlPath } from 'identifiers';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import { useFetchThreadsQuery } from 'state/api/threads';
import { useDateCursor } from 'state/api/threads/fetchThreads';
import useEXCEPTION_CASE_threadCountersStore from 'state/ui/thread';
import { slugify } from 'utils';
import { CWText } from 'views/components/component_kit/cw_text';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import {
  ThreadFeaturedFilterTypes,
  ThreadTimelineFilterTypes,
} from '../../../models/types';
import app from '../../../state';
import { useFetchTopicsQuery } from '../../../state/api/topics';
import { HeaderWithFilters } from './HeaderWithFilters';
import { ThreadCard } from './ThreadCard';
import { sortByFeaturedFilter, sortPinned } from './helpers';

import { getThreadActionTooltipText } from 'helpers/threads';
import 'pages/discussions/index.scss';
import { useRefreshMembershipQuery } from 'state/api/groups';

type DiscussionsPageProps = {
  topicName?: string;
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
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
    communityId: app.activeChainId(),
  });

  const topicId = (topics || []).find(({ name }) => name === topicName)?.id;

  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId: app.activeChainId(),
    address: app?.user?.activeAccount?.address,
  });

  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { dateCursor } = useDateCursor({
    dateRange: searchParams.get('dateRange') as ThreadTimelineFilterTypes,
  });

  const isOnArchivePage =
    location.pathname === `/${app.activeChainId()}/archived`;

  const { fetchNextPage, data, isInitialLoading, hasNextPage } =
    useFetchThreadsQuery({
      communityId: app.activeChainId(),
      queryType: 'bulk',
      page: 1,
      limit: 20,
      topicId,
      stage: stageName,
      includePinnedThreads: true,
      orderBy: featuredFilter,
      toDate: dateCursor.toDate,
      fromDate: dateCursor.fromDate,
      isOnArchivePage: isOnArchivePage,
    });

  const threads = sortPinned(sortByFeaturedFilter(data || [], featuredFilter));
  const filteredThreads = threads.filter((t) => {
    if (!includeSpamThreads && t.markedAsSpamAt) return null;

    if (!isOnArchivePage && !includeArchivedThreads && t.archivedAt !== null)
      return null;

    if (isOnArchivePage && t.archivedAt === null) return null;

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
            membership.topicIds.includes(thread.topic.id),
          );

          const isActionAllowedInGatedTopic = !!(memberships || []).find(
            (membership) =>
              membership.topicIds.includes(thread.topic.id) &&
              membership.isAllowed,
          );

          const disabledActionsTooltipText = getThreadActionTooltipText({
            isCommunityMember: !!hasJoinedCommunity,
            isThreadArchived: !!thread?.archivedAt,
            isThreadLocked: !!thread?.lockedAt,
            isThreadTopicGated: isTopicGated && !isActionAllowedInGatedTopic,
          });

          return (
            <ThreadCard
              key={thread.id + '-' + thread.readOnly}
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

                localStorage[`${app.activeChainId()}-discussions-scrollY`] =
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
          EmptyPlaceholder: () =>
            isInitialLoading ? (
              <div className="threads-wrapper">
                {Array(3)
                  .fill({})
                  .map((x, i) => (
                    <ThreadCard key={i} showSkeleton thread={{} as any} />
                  ))}
              </div>
            ) : (
              <CWText type="b1" className="no-threads-text">
                {isOnArchivePage
                  ? 'There are no archived threads matching your filter.'
                  : 'There are no threads matching your filter.'}
              </CWText>
            ),
          Header: () => {
            return (
              <HeaderWithFilters
                topic={topicName}
                stage={stageName}
                featuredFilter={featuredFilter}
                dateRange={dateRange}
                totalThreadCount={threads ? totalThreadsInCommunity : 0}
                isIncludingSpamThreads={includeSpamThreads}
                onIncludeSpamThreads={setIncludeSpamThreads}
                isIncludingArchivedThreads={includeArchivedThreads}
                onIncludeArchivedThreads={setIncludeArchivedThreads}
                isOnArchivePage={isOnArchivePage}
              />
            );
          },
        }}
      />
    </div>
  );
};

export default DiscussionsPage;
