import Thread from 'models/Thread';
import { ThreadStage } from 'models/types';
import moment from 'moment';
import 'pages/discussions/index.scss';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { CWText } from 'views/components/component_kit/cw_text';
import { ThreadActionType } from '../../../../../shared/types';
import {
  ThreadFeaturedFilterTypes,
  ThreadTimelineFilterTypes,
} from '../../../models/types';
import app from '../../../state';
import { useFetchTopicsQuery } from '../../../state/api/topics';
import Sublayout from '../../Sublayout';
import { PageLoading } from '../loading';
import { RecentThreadsHeader } from './recent_threads_header';
import { ThreadPreview } from './thread_preview';

type DiscussionsPageProps = {
  topicName?: string;
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const [threads, setThreads] = useState([]);
  const [totalThreads, setTotalThreads] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const [searchParams] = useSearchParams();
  const pageNumber = useRef<number>(0);
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

  const handleThreadUpdate = (data: {
    threadId: number;
    action: ThreadActionType;
    stage: ThreadStage;
  }) => {
    const { threadId, action, stage } = data;

    if (action === ThreadActionType.StageChange) {
      setThreads((oldThreads) => {
        const updatedThreads = [...oldThreads].filter(
          // make sure that if we have an active stage filter (from the dropdown)
          // then we also filter the current list for the current stage only
          (x) => x.stage === stageName
        );
        const foundThread = updatedThreads.find((x) => x.id === threadId);
        if (foundThread) foundThread.stage = stage;
        return updatedThreads;
      });
      return;
    }

    if (
      action === ThreadActionType.TopicChange ||
      action === ThreadActionType.Deletion
    ) {
      const updatedThreadList = threads.filter((t) => t.id !== threadId);

      setThreads(updatedThreadList);
    } else {
      const pinnedThreads = app.threads.listingStore.getThreads({
        topicName,
        stageName,
        pinned: true,
      });

      const unpinnedThreads = app.threads.listingStore.getThreads({
        topicName,
        stageName,
        pinned: false,
      });

      setThreads([...pinnedThreads, ...unpinnedThreads]);
    }
  };

  /**
   * the api will return sorted results and those are stored in state, when user
   * changes the filter we dont make a new api call, and use the state. New data is
   * fetched from api when user has reached the end of page.
   * ---
   * This function is responsible for sorting threads in state that were earlier
   * sorted by another featured flag
   */
  const sortByFeaturedFilter = (t: Thread[]) => {
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

  /**
   * the api will return sorted results and those are stored in state, when user
   * changes the filter we dont make a new api call, and use the state. New data is
   * fetched from api when user has reached the end of page.
   * ---
   * This function is responsible for sorting threads in state. Maybe the user pins a
   * thread, this thread is still in a lower position in the state object/arrary. This
   * function will sort those correctly.
   */
  const sortPinned = (t: Thread[]) => {
    return [...t].sort((a, b) =>
      a.pinned === b.pinned ? 1 : a.pinned ? -1 : 0
    );
  };

  // Event binding for actions that trigger a thread update (e.g. topic or stage change)
  useEffect(() => {
    app.threadUpdateEmitter.on('threadUpdated', (data) =>
      handleThreadUpdate(data)
    );

    return () => {
      app.threadUpdateEmitter.off('threadUpdated', handleThreadUpdate);
    };
  }, [threads]);

  useEffect(() => {
    setTotalThreads(app.threads.numTotalThreads);
  }, [app.threads.numTotalThreads]);

  // setup initial threads
  useEffect(() => {
    const timerId = setTimeout(() => {
      // always reset pagination on page change
      app.threads.resetPagination();

      // check if store already has atleast 20 threads for this community -> topic/stage,
      // if so dont fetch more for now (scrolling will fetch more)
      const chain = app.activeChainId();
      const foundThreadsForChain = app.threads.store
        .getAll()
        .filter((x) => x.chain === chain);
      if (foundThreadsForChain.length >= 20) {
        if (topicName || stageName || dateRange) {
          let finalThreads = foundThreadsForChain;

          // get threads for current topic
          const topicId = topics.find(({ name }) => name === topicName)?.id;
          if (topicId) {
            finalThreads = finalThreads.filter((x) => x?.topic?.id && x.topic.id === topicId);
          }

          // get threads for current stage
          if (stageName) {
            finalThreads = finalThreads.filter((x) => x.stage === stageName);
          }

          // get threads for current timeline
          if (
            dateRange &&
            [
              ThreadTimelineFilterTypes.ThisMonth,
              ThreadTimelineFilterTypes.ThisWeek,
            ].includes(dateRange)
          ) {
            const today = moment();
            const timeline = dateRange.toLowerCase().replace('this', '') as any;
            const fromDate = today.startOf(timeline).toISOString();
            const toDate = today.endOf(timeline).toISOString();

            finalThreads = finalThreads.filter(
              (x) =>
                moment(x.createdAt).isSameOrAfter(fromDate) &&
                moment(x.createdAt).isSameOrBefore(toDate)
            );
          }

          if (finalThreads.length >= 20) {
            setThreads(sortPinned(sortByFeaturedFilter(foundThreadsForChain)));
            setInitializing(false);
            return;
          }
        }
        // else show all threads
        else {
          setThreads(sortPinned(sortByFeaturedFilter(foundThreadsForChain)));
          setInitializing(false);
          return;
        }
      }

      // if the store has <= 20 threads then fetch more
      app.threads
        .loadNextPage({
          topicName,
          stageName,
          includePinnedThreads: true,
          featuredFilter,
          dateRange,
          page: pageNumber.current,
        })
        .then((t) => {
          // Fetch first 20 + unpinned threads

          setThreads(sortPinned(sortByFeaturedFilter(t.threads)));
          setInitializing(false);
        });
    });

    return () => clearTimeout(timerId);
  }, [stageName, topicName]);

  const loadMore = useCallback(async () => {
    const response = await app.threads.loadNextPage({
      topicName,
      stageName,
      featuredFilter,
      dateRange,
      page: pageNumber.current + 1,
    });
    // If no new threads (we reached the end)
    if (!response.threads) {
      return;
    }

    pageNumber.current = response.page;
    return setThreads((oldThreads) => {
      const finalThreads = [...oldThreads];
      response.threads.map((x) => {
        const foundIndex = finalThreads.findIndex(
          (y) => y.identifier === x.identifier
        );
        if (foundIndex === -1) {
          finalThreads.push(x);
        } else {
          finalThreads[foundIndex] = x;
        }
        return null;
      });

      return sortPinned(sortByFeaturedFilter(finalThreads));
    });
  }, [stageName, topicName, totalThreads, featuredFilter, dateRange]);

  if (initializing) {
    return <PageLoading hideSearch={false} />;
  }

  return (
    <Sublayout hideFooter={true} hideSearch={false}>
      <div className="DiscussionsPage">
        <Virtuoso
          style={{ height: '100%', width: '100%' }}
          data={threads}
          itemContent={(i, thread) => {
            return (
              <ThreadPreview thread={thread} key={thread.id + thread.stage} />
            );
          }}
          endReached={loadMore}
          overscan={200}
          components={{
            EmptyPlaceholder: () => (
              <CWText type="b1" className="no-threads-text">
                There are no threads matching your filter.
              </CWText>
            ),
            Header: () => {
              return (
                <RecentThreadsHeader
                  topic={topicName}
                  stage={stageName}
                  featuredFilter={featuredFilter}
                  dateRange={dateRange}
                  totalThreadCount={threads ? totalThreads : 0}
                />
              );
            },
          }}
        />
      </div>
    </Sublayout>
  );
};

export default DiscussionsPage;
