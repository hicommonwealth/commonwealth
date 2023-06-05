import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useSearchParams } from 'react-router-dom';

import 'pages/discussions/index.scss';

import app from '../../../state';
import Sublayout from '../../Sublayout';
import { PageLoading } from '../loading';
import { RecentThreadsHeader } from './recent_threads_header';
import { ThreadPreview } from './thread_preview';
import { ThreadActionType } from '../../../../../shared/types';
import { CWText } from 'views/components/component_kit/cw_text';
import { ThreadStage } from 'models/types';
import Thread from 'models/Thread';

import { NewThreadForm } from 'views/components/NewThreadForm';
import { isUndefined } from 'lodash';
import { CWButton } from '../../components/component_kit/cw_button';
import useSidebarStore from 'state/ui/sidebar';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import useForceRerender from 'hooks/useForceRerender';

type DiscussionsPageProps = {
  topicName?: string;
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const [threads, setThreads] = useState([]);
  const [totalThreads, setTotalThreads] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const [searchParams] = useSearchParams();
  const [customScrollParent, setCustomScrollParent] = useState(null);
  const stageName: string = searchParams.get('stage');
  const forceRerender = useForceRerender();
  const { rightSidebarVisible, setRightMenu } = useSidebarStore();
  const [newThreadContentDelta, setNewThreadContentDelta] = useState(null);
  const [windowIsExtraSmall, setWindowIsExtraSmall] = useState(
    isWindowExtraSmall(window.innerWidth)
  );
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

  const sortPinned = (t: Thread[]) => {
    return [...t].sort((a, b) =>
      a.pinned === b.pinned ? 1 : a.pinned ? -1 : 0
    );
  };

  useEffect(() => {
    const onResize = () => {
      setWindowIsExtraSmall(isWindowExtraSmall(window.innerWidth));
    };

    window.addEventListener('resize', onResize);
    app.loginStateEmitter.on('redraw', forceRerender);
    app.user.isFetched.on('redraw', forceRerender);

    return () => {
      window.removeEventListener('resize', onResize);
      app.loginStateEmitter.off('redraw', forceRerender);
      app.user.isFetched.off('redraw', forceRerender);
    };
  }, [forceRerender]);

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
      <div className="DiscussionsPage" ref={setCustomScrollParent}>
        <div className="discussions-left">
          <Virtuoso
            style={{
              height: '100%',
              padding: '24px',
            }}
            data={threads}
            customScrollParent={customScrollParent}
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
                  <div className="discussion-header">
                    {!isUndefined(topicName) && <NewThreadForm />}
                    <RecentThreadsHeader
                      topic={topicName}
                      stage={stageName}
                      totalThreadCount={threads ? totalThreads : 0}
                    />
                  </div>
                );
              },
            }}
          />
        </div>
        <div className="discussions-right">
          {windowIsExtraSmall ? (
            <CWIconButton
              className="add-action-button"
              iconName="plusCircle"
              iconButtonTheme="black"
              onClick={() => {
                setRightMenu({ isVisible: !rightSidebarVisible });
              }}
              disabled={!app.user.activeAccount}
            />
          ) : (
            <CWButton
              className="add-action-button"
              buttonType="mini-black"
              label="Add Action"
              iconLeft="plus"
              onClick={() => {
                setRightMenu({ isVisible: !rightSidebarVisible });
              }}
              disabled={!app.user.activeAccount}
            />
          )}
          <DiscussionsCard totalThreadCount={totalThreads} />
        </div>
      </div>
    </Sublayout>
  );
};

const DiscussionsCard = ({ totalThreadCount }) => {
  return (
    <CWCard elevation="elevation-1" className="discussions-card">
      <div className="header-row">
        <CWText type="h3" fontWeight="semiBold" className="header-text">
          All Discussions
        </CWText>
        <div className="count-and-button">
          <CWText
            type="caption"
            fontWeight="medium"
            className="thread-count-text"
          >
            {totalThreadCount} Threads
          </CWText>
        </div>
      </div>
      <CWText className="subheader-text">
        This section is for the community to discuss how to manage the community
        treasury and spending on contributor grants, community initiatives,
        liquidity mining and other programs.
      </CWText>
    </CWCard>
  );
};

export default DiscussionsPage;
