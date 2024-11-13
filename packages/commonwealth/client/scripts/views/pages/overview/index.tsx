import useBrowserWindow from 'hooks/useBrowserWindow';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/index.scss';
import 'pages/overview/index.scss';
import React from 'react';
import app from 'state';
import { useFetchThreadsQuery } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import type Thread from '../../../models/Thread';
import type { Topic } from '../../../models/Topic';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWText } from '../../components/component_kit/cw_text';
import { TopicSummaryRow } from './TopicSummaryRow';

const OverviewPage = () => {
  const navigate = useCommonNavigate();
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const user = useUserStore();

  const communityId = app.activeChainId() || '';
  const { data: recentlyActiveThreads, isLoading } = useFetchThreadsQuery({
    queryType: 'active',
    communityId,
    topicsPerThread: 3,
    withXRecentComments: 3,
    apiEnabled: !!communityId,
  });

  const { data: topics = [] } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const anyTopicsFeatured = topics.some((t) => t.featured_in_sidebar);

  const topicsFiltered = anyTopicsFeatured
    ? topics.filter((t) => t.featured_in_sidebar)
    : topics;

  const topicsSorted = anyTopicsFeatured
    ? // @ts-expect-error <StrictNullChecks/>
      topicsFiltered.sort((a, b) => a.order - b.order)
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

  return (
    <CWPageLayout>
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
              disabled={!user.activeAccount}
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
        {!isLoading && topicSummaryRows.length === 0 && (
          <CWText type="b1" className="empty-placeholder">
            No threads available
          </CWText>
        )}
      </div>
    </CWPageLayout>
  );
};

export default OverviewPage;
