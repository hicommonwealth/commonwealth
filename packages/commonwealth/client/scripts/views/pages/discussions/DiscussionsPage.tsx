import { getProposalUrlPath } from 'identifiers';
import Thread from 'models/Thread';
import moment from 'moment';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/index.scss';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { slugify } from 'utils';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  ThreadFeaturedFilterTypes,
  ThreadTimelineFilterTypes,
} from '../../../models/types';
import app from '../../../state';
import Sublayout from '../../Sublayout';
import { PageLoading } from '../loading';
import { RecentThreadsHeader } from './recent_threads_header';
import { ThreadCard } from './ThreadCard';

type DiscussionsPageProps = {
  topicName?: string;
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const navigate = useCommonNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
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
          const topicId = app.topics.getByName(topicName, chain)?.id;
          if (topicId) {
            finalThreads = finalThreads.filter((x) => x.topic.id === topicId);
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
          className="thread-list"
          style={{ height: '100%', width: '100%', position: 'inherit' }}
          data={threads}
          itemContent={(i, thread) => {
            const discussionLink = getProposalUrlPath(
              thread.slug,
              `${thread.identifier}-${slugify(thread.title)}`
            );

            return (
              <ThreadCard
                key={thread.id + '-' + thread.readOnly}
                thread={thread}
                onLockToggle={(isLocked) => {
                  const tempThreads = [...threads];
                  const foundThread = tempThreads.find(
                    (t) => t.id === thread.id
                  );
                  foundThread.readOnly = isLocked;
                  setThreads(tempThreads);
                }}
                onPinToggle={(isPinned) => {
                  const tempThreads = [...threads];
                  const foundThread = tempThreads.find(
                    (t) => t.id === thread.id
                  );
                  foundThread.pinned = isPinned;
                  setThreads(tempThreads);
                }}
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
                  setThreads((oldThreads) => {
                    const updatedThreads = [...oldThreads];
                    const foundThread = updatedThreads.find(
                      (x) => x.id === thread.id
                    );
                    if (foundThread)
                      foundThread.markedAsSpamAt = updatedThread.markedAsSpamAt;
                    return updatedThreads;
                  });
                }}
                onDelete={() => {
                  const tempThreads = [...threads].filter(
                    (t) => t.id !== thread.id
                  );
                  setThreads(tempThreads);
                }}
                onTopicChange={(topic) => {
                  if (topic.id !== thread.topic.id) {
                    const tempThreads = [...threads].filter(
                      (t) => t.id !== thread.id
                    );

                    setThreads(tempThreads);
                  }
                }}
                onProposalStageChange={(stage) => {
                  setThreads((oldThreads) => {
                    const updatedThreads = [...oldThreads].filter(
                      // make sure that if we have an active stage filter (from the dropdown)
                      // then we also filter the current list for the current stage only
                      (x) => x.stage === stageName
                    );
                    const foundThread = updatedThreads.find(
                      (x) => x.id === thread.id
                    );
                    if (foundThread) foundThread.stage = stage;
                    return updatedThreads;
                  });
                }}
                // onSpamToggle
              />
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
