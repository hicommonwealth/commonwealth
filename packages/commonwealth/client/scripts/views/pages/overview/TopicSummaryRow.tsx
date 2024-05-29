import { slugify } from '@hicommonwealth/shared';
import { getThreadActionTooltipText } from 'client/scripts/helpers/threads';
import Permissions from 'client/scripts/utils/Permissions';
import { getProposalUrlPath } from 'identifiers';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/overview/TopicSummaryRow.scss';
import React from 'react';
import type Thread from '../../../models/Thread';
import type Topic from '../../../models/Topic';
import { CWText } from '../../components/component_kit/cw_text';
import { ThreadCard } from '../discussions/ThreadCard';
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
            {topic.totalThreads || 0} Threads
          </CWText>
        </div>
        {topic.description && <CWText type="b2">{topic.description}</CWText>}
      </div>
      <div className="recent-threads-column">
        {threadsToDisplay.map((thread, idx) => {
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

          const disabledActionsTooltipText = getThreadActionTooltipText({
            isCommunityMember: Permissions.isCommunityMember(
              thread.communityId,
            ),
            isThreadArchived: !!thread?.archivedAt,
            isThreadLocked: !!thread?.lockedAt,
            // isThreadTopicGated: isRestrictedMembership, // TODO
          });

          return (
            <ThreadCard
              key={thread.id}
              thread={thread}
              hideReactionButton
              hideUpvotesDrawer
              threadHref={discussionLink}
              canComment={!disabledActionsTooltipText}
              disabledActionsTooltipText={disabledActionsTooltipText}
              onStageTagClick={() => {
                navigate(`/discussions?stage=${thread.stage}`);
              }}
              onCommentBtnClick={() =>
                navigate(`${discussionLinkWithoutChain}?focusEditor=true`)
              }
              onEditStart={() => navigate(`${discussionLinkWithoutChain}`)}
            />
          );
        })}
      </div>
    </div>
  );
};
