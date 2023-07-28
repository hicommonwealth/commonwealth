import { getProposalUrlPath } from 'identifiers';
import Thread from 'models/Thread';
import moment from 'moment';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/index.scss';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { useFetchThreadsQuery } from 'state/api/threads';
import { slugify } from 'utils';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  ThreadFeaturedFilterTypes,
  ThreadTimelineFilterTypes,
} from '../../../models/types';
import app from '../../../state';
import { useFetchTopicsQuery } from '../../../state/api/topics';
import { HeaderWithFilters } from './HeaderWithFilters';
import { ThreadCard } from './ThreadCard';

type DiscussionsPageProps = {
  topicName?: string;
};

/**
 * This function is responsible for sorting threads in state. Maybe the user pins a
 * thread, this thread is still in a lower position in the state object/arrary. This
 * function will sort those correctly.
 */
const sortPinned = (t: Thread[]) => {
  return [...t].sort((a, b) =>
    a.pinned === b.pinned ? 1 : a.pinned ? -1 : 0
  );
};

/**
 * This function is responsible for sorting threads in state that were earlier
 * sorted by another featured flag
 */
const sortByFeaturedFilter = (t: Thread[], featuredFilter) => {
  if (featuredFilter === ThreadFeaturedFilterTypes.Oldest) {
    return [...t].sort((a, b) =>
      moment(a.createdAt).diff(moment(b.createdAt))
    );
  }

  if (featuredFilter === ThreadFeaturedFilterTypes.MostComments) {
    return [...t].sort((a, b) => b.numberOfComments - a.numberOfComments);
  }

  if (featuredFilter === ThreadFeaturedFilterTypes.MostLikes) {
    return [...t].sort(
      (a, b) => b.associatedReactions.length - a.associatedReactions.length
    );
  }

  // Default: Assuming featuredFilter === 'newest'
  return [...t].sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const navigate = useCommonNavigate();
  const totalThreads = app.threads.numTotalThreads;
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

  // const { dateCursor } = useDateCursor({
  //   dateRange: searchParams.get(
  //     'dateRange'
  //   ) as ThreadTimelineFilterTypes
  // })

  const { fetchNextPage, data, isInitialLoading } = useFetchThreadsQuery({
    chainId: app.activeChainId(),
    queryType: 'bulk',
    page: 1,
    limit: 20,
    topicId: (topics || []).find(({ name }) => name === topicName)?.id,
    stage: stageName,
    includePinnedThreads: true,
    orderBy: featuredFilter,
    // toDate: dateCursor.toDate,
    toDate: '2023-07-27T11:00:16.924Z' // todo: REPLACE THIS
    // fromDate: dateCursor.fromDate, // todo: REPLACE THIS
  })

  const threads = sortPinned(sortByFeaturedFilter(data || [], featuredFilter))

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

          return (
            <ThreadCard
              key={thread.id + '-' + thread.readOnly}
              thread={thread}
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
              onSpamToggle={(updatedThread) => {
                // setThreads((oldThreads) => {
                //   const updatedThreads = [...oldThreads];
                //   const foundThread = updatedThreads.find(
                //     (x) => x.id === thread.id
                //   );
                //   if (foundThread)
                //     foundThread.markedAsSpamAt = updatedThread.markedAsSpamAt;
                //   return updatedThreads;
                // });
              }}
              onTopicChange={(topic) => {
                if (topic.id !== thread.topic.id) {
                  const tempThreads = [...threads].filter(
                    (t) => t.id !== thread.id
                  );

                  // setThreads(tempThreads);
                }
              }}
            />
          );
        }}
        endReached={() => fetchNextPage()}
        overscan={200}
        components={{
          EmptyPlaceholder: () =>
            isInitialLoading ? (
              <div className="thread-loader">
                <CWSpinner size="xl" />
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
                totalThreadCount={threads ? totalThreads : 0}
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
