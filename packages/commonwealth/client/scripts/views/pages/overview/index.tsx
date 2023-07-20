import useBrowserWindow from 'hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/overview/index.scss';
import React, { useEffect } from 'react';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import type Thread from '../../../models/Thread';
import type Topic from '../../../models/Topic';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { PageLoading } from '../loading';
import { TopicSummaryRow } from './topic_summary_row';
import useUserActiveAccount from 'hooks/useUserActiveAccount';

const OverviewPage = () => {
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();
  const { isWindowExtraSmall } = useBrowserWindow({});
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  useEffect(() => {
    app.threads.isFetched.on('redraw', forceRerender);
    app.loginStateEmitter.on('redraw', forceRerender);

    return () => {
      app.threads.isFetched.off('redraw', forceRerender);
      app.loginStateEmitter.off('redraw', forceRerender);
    };
  }, [forceRerender]);

  const allMonthlyThreads = app.threads.overviewStore.getAll();
  const allPinnedThreads = app.threads.listingStore.getThreads({
    pinned: true,
  });

  const { data: topics = [] } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
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
    const monthlyThreads = allMonthlyThreads.filter(
      (thread) => topic?.id && thread.topic?.id && topic.id === thread.topic.id
    );
    const pinnedThreads = allPinnedThreads.filter(
      (thread) => topic?.id && thread.topic?.id && topic.id === thread.topic.id
    );

    return {
      monthlyThreads,
      pinnedThreads,
      topic,
    };
  });

  return !topicSummaryRows.length && !app.threads.initialized ? (
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
            buttonType="mini-black"
            label="Latest Threads"
            iconLeft="home"
            onClick={() => {
              navigate('/discussions');
            }}
          />
        </div>
        {isWindowExtraSmall ? (
          <CWIconButton
            iconName="plusCircle"
            iconButtonTheme="black"
            onClick={() => {
              navigate('/new/discussion');
            }}
            disabled={!hasJoinedCommunity}
          />
        ) : (
          <CWButton
            buttonType="mini-black"
            label="Create Thread"
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
        <TopicSummaryRow {...row} key={i} />
      ))}
    </div>
  );
};

export default OverviewPage;
