import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import app from '../../../state';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';
import { RecentThreadsHeader } from './recent_threads_header';
import { ThreadPreview } from './thread_preview';

import 'pages/discussions/index.scss';

function DiscussionsPage({ topicName, stageName }) {
  const [threads, setThreads] = useState([]);
  const [initializing, setInitializing] = useState(true);

  // setup initial threads
  useEffect(() => {
    // set pinned threads
    setThreads(
      app.threads.listingStore.getThreads({
        topicName,
        stageName,
        pinned: true,
      })
    );
    app.threads.loadNextPage({ topicName, stageName }).then(() => {
      // add unpinned threads
      setThreads((oldThreads) => [
        ...oldThreads,
        ...app.threads.listingStore.getThreads({
          topicName,
          stageName,
          pinned: false,
        }),
      ]);

      setInitializing(false);
    });
  }, []);

  const loadMore = useCallback(async () => {
    const newThreads = await app.threads.loadNextPage({ topicName, stageName });
    // If no new threads (we reached the end)
    if (!newThreads) {
      return;
    }

    return setThreads((oldThreads) => [...oldThreads, ...newThreads]);
  }, [threads]);

  if (initializing) {
    return <PageLoading />;
  }
  return (
    <Sublayout>
      <div className="DiscussionsPage">
        <RecentThreadsHeader
          topic={topicName}
          stage={stageName}
          totalThreadCount={threads.length}
        />
        <Virtuoso
          style={{ height: '600px', width: '100%' }}
          data={threads}
          itemContent={(i, thread) => {
            return <ThreadPreview thread={thread} key={`${i}`} />;
          }}
          endReached={loadMore}
        />
      </div>
    </Sublayout>
  );
}

export default DiscussionsPage;
