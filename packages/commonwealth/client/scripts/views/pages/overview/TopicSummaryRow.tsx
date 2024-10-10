import { GroupTopicPermissionEnum } from '@hicommonwealth/schemas';
import { slugify } from '@hicommonwealth/shared';
import { getThreadActionTooltipText } from 'helpers/threads';
import useTopicGating from 'hooks/useTopicGating';
import { getProposalUrlPath } from 'identifiers';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/overview/TopicSummaryRow.scss';
import React from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
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
  const user = useUserStore();

  const communityId = app.activeChainId() || '';

  const { memberships, topicPermissions } = useTopicGating({
    communityId,
    userAddress: user.activeAccount?.address || '',
    apiEnabled: !!user.activeAccount?.address || !!communityId,
  });

  if (isLoading) return <TopicSummaryRowSkeleton />;

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

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

          const isTopicGated = !!(memberships || []).find(
            (membership) =>
              thread?.topic?.id &&
              membership.topics.find((t) => t.id === thread.topic.id),
          );

          const isActionAllowedInGatedTopic = !!(memberships || []).find(
            (membership) =>
              thread?.topic?.id &&
              membership.topics.find((t) => t.id === thread.topic.id) &&
              membership.isAllowed,
          );

          const isRestrictedMembership =
            !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

          const foundTopicPermissions = topicPermissions.find(
            (tp) => tp.id === thread.topic.id,
          );

          const disabledActionsTooltipText = getThreadActionTooltipText({
            isCommunityMember: Permissions.isCommunityMember(
              thread.communityId,
            ),
            isThreadArchived: !!thread?.archivedAt,
            isThreadLocked: !!thread?.lockedAt,
            isThreadTopicGated: isRestrictedMembership,
            threadTopicInteractionRestriction:
              !foundTopicPermissions?.permission?.includes(
                GroupTopicPermissionEnum.UPVOTE_AND_COMMENT, // on this page we only show comment option
              )
                ? foundTopicPermissions?.permission
                : undefined,
          });

          return (
            <ThreadCard
              key={thread.id}
              thread={thread}
              canReact={!disabledActionsTooltipText}
              canComment={!disabledActionsTooltipText}
              canUpdateThread={false} // we dont want user to update thread from here, even if they have permissions
              onStageTagClick={() => {
                navigate(`/discussions?stage=${thread.stage}`);
              }}
              threadHref={discussionLink}
              onCommentBtnClick={() =>
                navigate(`${discussionLinkWithoutChain}?focusComments=true`)
              }
              disabledActionsTooltipText={disabledActionsTooltipText}
              hideReactionButton
              hideUpvotesDrawer
            />
          );
        })}
      </div>
    </div>
  );
};
