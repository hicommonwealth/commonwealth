import { slugify } from '@hicommonwealth/shared';
import useTopicGating from 'hooks/useTopicGating';
import { getProposalUrlPath } from 'identifiers';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import type Thread from '../../../models/Thread';
import type { Topic } from '../../../models/Topic';
import { CWText } from '../../components/component_kit/cw_text';
import { ThreadCard } from '../discussions/ThreadCard';
import './TopicSummaryRow.scss';
import { TopicSummaryRowSkeleton } from './TopicSummaryRowSkeleton';

type TopicSummaryRowProps = {
  monthlyThreads: Array<Thread>;
  pinnedThreads: Array<Thread>;
  topic: Topic;
  isLoading?: boolean;
};

export const TopicSummaryRow = ({
  monthlyThreads = [],
  pinnedThreads = [],
  topic,
  isLoading,
}: TopicSummaryRowProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const communityId = app.activeChainId() || '';

  const { actionGroups, bypassGating } = useTopicGating({
    communityId,
    userAddress: user.activeAccount?.address || '',
    apiEnabled: !!user.activeAccount?.address || !!communityId,
  });

  if (isLoading) return <TopicSummaryRowSkeleton />;

  const topSortedThreads = monthlyThreads
    .sort((a, b) => {
      const aLastUpdated = a.lastCommentedOn || a.createdAt;
      const bLastUpdated = b.lastCommentedOn || b.createdAt;
      return bLastUpdated.valueOf() - aLastUpdated.valueOf();
    })
    .slice(0, 5 - monthlyThreads.length);

  const threadsToDisplay = pinnedThreads.concat(topSortedThreads);

  return (
    <div className="TopicSummaryRow">
      <div className="topic-column">
        <div className="name-and-count">
          <CWText
            type="h4"
            fontWeight="semiBold"
            className="topic-name-text"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/discussions/${encodeURI(topic.name)}`);
            }}
          >
            {topic.name}
          </CWText>
          <CWText
            type="caption"
            fontWeight="medium"
            className="threads-count-text"
          >
            {topic.total_threads || 0} Threads
          </CWText>
        </div>
        {topic.description && <CWText type="b2">{topic.description}</CWText>}
      </div>
      <div className="recent-threads-column">
        {threadsToDisplay.map((thread) => {
          const discussionLink = getProposalUrlPath(
            thread.slug,
            `${thread.identifier}-${slugify(thread.title)}`,
            false,
          );
          const discussionLinkWithoutChain = getProposalUrlPath(
            thread.slug,
            `${thread.identifier}-${slugify(thread.title)}`,
            true,
          );

          return (
            <ThreadCard
              key={thread.id}
              thread={thread}
              canUpdateThread={false} // we dont want user to update thread from here, even if they have permissions
              onStageTagClick={() => {
                navigate(`/discussions?stage=${thread.stage}`);
              }}
              threadHref={discussionLink}
              onCommentBtnClick={() =>
                navigate(`${discussionLinkWithoutChain}?focusComments=true`)
              }
              hideReactionButton
              hideUpvotesDrawer
              expandCommentBtnVisible
              actionGroups={actionGroups}
              bypassGating={bypassGating}
            />
          );
        })}
      </div>
    </div>
  );
};
