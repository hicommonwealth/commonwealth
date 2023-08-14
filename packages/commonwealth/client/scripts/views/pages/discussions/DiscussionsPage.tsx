import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { getProposalUrlPath } from 'identifiers';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/index.scss';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { useFetchThreadsQuery } from 'state/api/threads';
import { useDateCursor } from 'state/api/threads/fetchThreads';
import useEXCEPTION_CASE_threadCountersStore from 'state/ui/thread';
import { slugify } from 'utils';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  ThreadFeaturedFilterTypes,
  ThreadTimelineFilterTypes,
} from '../../../models/types';
import app from '../../../state';
import { useFetchTopicsQuery } from '../../../state/api/topics';
import { HeaderWithFilters } from './HeaderWithFilters';
import { ThreadCard } from './ThreadCard';
import { sortByFeaturedFilter, sortPinned } from './helpers';

type DiscussionsPageProps = {
  topicName?: string;
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const navigate = useCommonNavigate();
  const { totalThreadsInCommunity } = useEXCEPTION_CASE_threadCountersStore();
  const [includeSpamThreads, setIncludeSpamThreads] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const stageName: string = searchParams.get('stage');
  const featuredFilter: ThreadFeaturedFilterTypes = searchParams.get(
    'featured'
  ) as ThreadFeaturedFilterTypes;
  const dateRange: ThreadTimelineFilterTypes = searchParams.get(
    'dateRange'
  ) as ThreadTimelineFilterTypes;
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { dateCursor } = useDateCursor({
    dateRange: searchParams.get('dateRange') as ThreadTimelineFilterTypes,
  });

  const { fetchNextPage, data, isInitialLoading } = useFetchThreadsQuery({
    chainId: app.activeChainId(),
    queryType: 'bulk',
    page: 1,
    limit: 20,
    topicId: (topics || []).find(({ name }) => name === topicName)?.id,
    stage: stageName,
    includePinnedThreads: true,
    orderBy: featuredFilter,
    toDate: dateCursor.toDate,
    fromDate: dateCursor.fromDate,
  });

  const threads = sortPinned(sortByFeaturedFilter(data || [], featuredFilter));

  useEffect(() => {
    document.title = `${app.chain.meta.name} – Discussions`;
  }, []);

  return (
    <div className="DiscussionsPage">
      <Virtuoso
        className="thread-list"
        style={{ height: '100%', width: '100%' }}
        data={isInitialLoading ? [] : threads}
        itemContent={(i, thread) => {
          const discussionLink = getProposalUrlPath(
            thread.slug,
            `${thread.identifier}-${slugify(thread.title)}`
          );

          if (!includeSpamThreads && thread.markedAsSpamAt) return null;

          const canReact =
            hasJoinedCommunity && !thread.lockedAt && !thread.archivedAt;
          return (
            <ThreadCard
              key={thread.id + '-' + thread.readOnly}
              thread={thread}
              canReact={canReact}
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
            />
          );
        }}
        endReached={() => fetchNextPage()}
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
                There are no threads matching your filter.
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
              />
            );
          },
        }}
      />
    </div>
  );
};

export default DiscussionsPage;
