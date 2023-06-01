import { getProposalUrlPath } from 'identifiers';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/index.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { slugify } from 'utils';
import { CWText } from 'views/components/component_kit/cw_text';
import { ThreadActionType } from '../../../../../shared/types';
import Thread from '../../../models/Thread';
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
  const stageName: string = searchParams.get('stage');

  // [CLEANUP]: We should remove this handler
  const handleThreadUpdate = (data: {
    threadId: number;
    action: ThreadActionType;
  }) => {
    const { action } = data;

    if (
      action === ThreadActionType.TopicChange ||
      action === ThreadActionType.Deletion
    ) {
      return;
    }

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
  };

  // [CLEANUP]: We should remove this handler
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
      .loadNextPage({ topicName, stageName, includePinnedThreads: true })
      .then((t) => {
        // Fetch first 20 + unpinned threads
        setThreads(t);
        // !totalThreads && setTotalThreads(totalResults);
        setInitializing(false);
      });
  }, [stageName, topicName]);

  const loadMore = useCallback(async () => {
    const newThreads = await app.threads.loadNextPage({ topicName, stageName });
    // If no new threads (we reached the end)
    if (!newThreads) {
      return;
    }

    // !totalThreads && setTotalThreads(response.totalResults);
    return setThreads((oldThreads) => [...oldThreads, ...newThreads]);
  }, [stageName, topicName, totalThreads]);

  if (initializing) {
    return <PageLoading />;
  }
  return (
    <Sublayout hideFooter={true}>
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
