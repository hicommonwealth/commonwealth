import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useSearchParams } from 'react-router-dom';

import 'pages/discussions/index.scss';

import app from '../../../state';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';
import { RecentThreadsHeader } from './recent_threads_header';
import { ThreadPreview } from './thread_preview';

type DiscussionsPageProps = {
  topicName?: string;
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const [threads, setThreads] = useState([]);
  const [initializing, setInitializing] = useState(true);
  const [searchParams, _] = useSearchParams();
  const stageName: string = searchParams.get('stage');

  // setup initial threads
  useEffect(() => {
    app.threads
      .loadNextPage({ topicName, stageName, includePinnedThreads: true })
      .then((t) => {
        // Fetch first 20 + unpinned threads
        setThreads(t);

        setInitializing(false);
      });
  }, [stageName, topicName]);

  const loadMore = useCallback(async () => {
    const newThreads = await app.threads.loadNextPage({ topicName, stageName });
    // If no new threads (we reached the end)
    if (!newThreads) {
      return;
    }

    return setThreads((oldThreads) => [...oldThreads, ...newThreads]);
  }, [stageName, topicName]);

  if (initializing) {
    return <PageLoading />;
  }
  return (
    <Sublayout>
      <div className="DiscussionsPage">
        <RecentThreadsHeader
          topic={topicName}
          stage={stageName}
          totalThreadCount={threads?.length || 0}
        />
        <Virtuoso
          style={{ height: '100%', width: '100%' }}
          data={threads}
          itemContent={(i, thread) => {
            return <ThreadPreview thread={thread} key={`${i}`} />;
          }}
          endReached={loadMore}
          overscan={200}
        />
      </div>
    </Sublayout>
  );
};

export default DiscussionsPage;
