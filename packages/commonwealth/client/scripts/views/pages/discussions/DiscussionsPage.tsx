import { getProposalUrlPath } from 'identifiers';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/index.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { slugify } from 'utils';
import { CWText } from 'views/components/component_kit/cw_text';
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
        if (topicName || stageName) {
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

          if (finalThreads.length >= 20) {
            setThreads(sortPinned(finalThreads));
            setInitializing(false);
            return;
          }
        }
        // else show all threads
        else {
          setThreads(sortPinned(foundThreadsForChain));
          setInitializing(false);
          return;
        }
      }

      // if the store has <= 20 threads then fetch more
      app.threads
        .loadNextPage({ topicName, stageName, includePinnedThreads: true })
        .then((t) => {
          // Fetch first 20 + unpinned threads
          setThreads(sortPinned(t));
          setInitializing(false);
        });
    });

    return () => clearTimeout(timerId);
  }, [stageName, topicName]);

  const loadMore = useCallback(async () => {
    const newThreads = await app.threads.loadNextPage({ topicName, stageName });
    // If no new threads (we reached the end)
    if (!newThreads) {
      return;
    }

    return setThreads((oldThreads) => {
      const finalThreads = [...oldThreads];
      newThreads.map((x) => {
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
      return sortPinned(finalThreads);
    });
  }, [stageName, topicName]);

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
