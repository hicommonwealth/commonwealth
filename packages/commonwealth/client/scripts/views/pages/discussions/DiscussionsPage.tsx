import 'pages/discussions/index.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { CWText } from 'views/components/component_kit/cw_text';
import { ThreadActionType } from '../../../../../shared/types';
import app from '../../../state';
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
  const stageName: string = searchParams.get('stage');
  const featuredFilter: string = searchParams.get('featured');
  const dateRange: string = searchParams.get('dateRange');

  const handleThreadUpdate = (data: {
    threadId: number;
    action: ThreadActionType;
  }) => {
    const { threadId, action } = data;

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
    app.threads.resetPagination();
    app.threads
      .loadNextPage({
        topicName,
        stageName,
        includePinnedThreads: true,
        featuredFilter,
        dateRange,
      })
      .then((t) => {
        // Fetch first 20 + unpinned threads
        setThreads(t);
        // !totalThreads && setTotalThreads(totalResults);
        setInitializing(false);
      });
  }, [stageName, topicName, featuredFilter, dateRange]);

  const loadMore = useCallback(async () => {
    const newThreads = await app.threads.loadNextPage({
      topicName,
      stageName,
      featuredFilter,
      dateRange,
    });
    // If no new threads (we reached the end)
    if (!newThreads) {
      return;
    }

    // !totalThreads && setTotalThreads(response.totalResults);
    return setThreads((oldThreads) => [...oldThreads, ...newThreads]);
  }, [stageName, topicName, totalThreads, featuredFilter, dateRange]);

  if (initializing) {
    return <PageLoading />;
  }

  return (
    <Sublayout hideFooter={true}>
      <div className="DiscussionsPage">
        <Virtuoso
          style={{ height: '100%', width: '100%' }}
          data={threads}
          itemContent={(i, thread) => {
            return <ThreadPreview thread={thread} key={thread.id} />;
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
