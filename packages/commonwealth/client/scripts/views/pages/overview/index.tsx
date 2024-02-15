import useBrowserWindow from 'hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/index.scss';
import 'pages/overview/index.scss';
import React, { useEffect } from 'react';
import app from 'state';
import { useFetchThreadsQuery } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import type Thread from '../../../models/Thread';
import type Topic from '../../../models/Topic';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWText } from '../../components/component_kit/cw_text';
import { PageLoading } from '../loading';
import { TopicSummaryRow } from './TopicSummaryRow';

const OverviewPage = () => {
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { data: recentlyActiveThreads, isLoading } = useFetchThreadsQuery({
    queryType: 'active',
    communityId: app.activeChainId(),
    topicsPerThread: 3,
    // TODO: ask for a pinned thread prop here to show pinned threads
  });

  useEffect(() => {
    app.loginStateEmitter.on('redraw', forceRerender);

    return () => {
      app.loginStateEmitter.off('redraw', forceRerender);
    };
  }, [forceRerender]);

  const { data: topics = [] } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const anyTopicsFeatured = topics.some((t) => t.featuredInSidebar);

  const topicsFiltered = anyTopicsFeatured
    ? topics.filter((t) => t.featuredInSidebar)
    : topics;

  const topicsSorted = anyTopicsFeatured
    ? topicsFiltered.sort((a, b) => a.order - b.order)
    : topicsFiltered.sort((a, b) => a.name.localeCompare(b.name)); // alphabetizes non-ordered + non-featured topics

  const topicSummaryRows: Array<{
    monthlyThreads: Array<Thread>;
    pinnedThreads: Array<Thread>;
    topic: Topic;
  }> = topicsSorted.map((topic) => {
    const monthlyThreads = (recentlyActiveThreads || []).filter(
      (thread) =>
        topic?.id &&
        thread.topic?.id &&
        topic.id === thread.topic.id &&
        thread.archivedAt === null &&
        !thread.markedAsSpamAt,
    );

    return {
      monthlyThreads,
      pinnedThreads: [], // TODO: ask for a pinned thread prop in /threads?active=true api to show pinned threads
      topic,
    };
  });

  return !topicSummaryRows.length ? (
    <PageLoading />
  ) : (
    <div className="OverviewPage">
      <div className="header-row">
        <div className="header-row-left">
          <CWText type="h3" fontWeight="semiBold">
            Overview
          </CWText>
          <CWButton
            className="latest-button"
            buttonType="primary"
            buttonHeight="sm"
            label="Latest Threads"
            iconLeft="home"
            onClick={() => {
              navigate('/discussions');
            }}
          />
        </div>
        {!isWindowSmallInclusive && (
          <CWButton
            buttonType="primary"
            buttonHeight="sm"
            label="Create thread"
            iconLeft="plus"
            onClick={() => {
              navigate('/new/discussion');
            }}
            disabled={!hasJoinedCommunity}
          />
        )}
      </div>
      <div className="column-headers-row">
        <CWText
          type="h5"
          fontWeight="semiBold"
          className="threads-header-row-text"
        >
          Topic
        </CWText>
        <div className="threads-header-container">
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="threads-header-row-text"
          >
            Recent threads
          </CWText>
        </div>
      </div>
      <CWDivider />
      {topicSummaryRows.map((row, i) => (
        <TopicSummaryRow {...row} key={i} isLoading={isLoading} />
      ))}
    </div>
  );
};

export default OverviewPage;
