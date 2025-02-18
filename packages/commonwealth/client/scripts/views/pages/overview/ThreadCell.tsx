import { PermissionEnum } from '@hicommonwealth/schemas';
import { ProposalType, slugify } from '@hicommonwealth/shared';
import { pluralize } from 'client/scripts/helpers';
import { extractImages } from 'client/scripts/helpers/feed';
import { getProposalUrlPath } from 'client/scripts/identifiers';
import Thread from 'client/scripts/models/Thread';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import useUserStore from 'client/scripts/state/ui/user';
import Permissions from 'client/scripts/utils/Permissions';
import moment from 'moment';
import React from 'react';
import threadPlaceholder from '../../../../assets/img/threadplaceholder.png';
import MarkdownViewerWithFallback from '../../components/MarkdownViewerWithFallback';
import { SharePopover } from '../../components/SharePopover';
import { ThreadContestTagContainer } from '../../components/ThreadContestTag';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { CWThreadAction } from '../../components/component_kit/new_designs/cw_thread_action';
import { NewThreadTag } from '../discussions/NewThreadTag';
import { ReactionButton } from '../discussions/ThreadCard/ThreadOptions/ReactionButton';
import { ToggleThreadSubscribe } from '../discussions/ThreadCard/ThreadOptions/ToggleThreadSubscribe';
import { isHot, removeImageFormMarkDown } from '../discussions/helpers';

import { getThreadActionTooltipText } from 'client/scripts/helpers/threads';
import { Memberships } from 'client/scripts/state/api/groups/refreshMembership';
import './ThreadCell.scss';

type TopicPermission = { id: number; permissions: PermissionEnum[] };

export type RenderThreadCellProps = {
  thread: Thread;
  memberships?: Memberships[];
  topicPermissions?: TopicPermission[];
};
const ThreadCell = ({
  thread,
  memberships,
  topicPermissions,
}: RenderThreadCellProps) => {
  const user = useUserStore();
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const isTopicGated = !!(memberships || []).find(
    (membership) =>
      thread?.topic?.id &&
      membership.topics.find((t) => t.id === thread.topic!.id),
  );

  const isActionAllowedInGatedTopic = !!(memberships || []).find(
    (membership) =>
      thread?.topic?.id &&
      membership.topics.find((t) => t.id === thread.topic!.id) &&
      membership.isAllowed,
  );

  const isRestrictedMembership =
    !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

  const foundTopicPermissions = topicPermissions?.find(
    (tp) => tp.id === thread.topic!.id,
  );

  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!user.activeAccount,
    isThreadArchived: !!thread?.archivedAt,
    isThreadLocked: !!thread?.lockedAt,
    isThreadTopicGated: isRestrictedMembership,
  });

  const disabledReactPermissionTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!user.activeAccount,
    threadTopicInteractionRestrictions:
      !isAdmin &&
      !foundTopicPermissions?.permissions?.includes(
        PermissionEnum.CREATE_THREAD_REACTION,
      )
        ? foundTopicPermissions?.permissions
        : undefined,
  });

  const disabledCommentPermissionTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!user.activeAccount,
    threadTopicInteractionRestrictions:
      !isAdmin &&
      !foundTopicPermissions?.permissions?.includes(
        PermissionEnum.CREATE_COMMENT,
      )
        ? foundTopicPermissions?.permissions
        : undefined,
  });

  const image = extractImages(thread?.body);
  const showTag = isHot(thread);
  const threadBody = removeImageFormMarkDown(thread.body);

  const discussionLink = getProposalUrlPath(
    ProposalType.Thread,
    `${thread?.id}-${slugify(thread?.title)}`,
    false,
    thread?.communityId,
  );
  const shareEndpoint = `${window.location.origin}${discussionLink}`;
  const { data: fetchedCommunity } = useGetCommunityByIdQuery({
    id: thread.communityId,
    enabled: !!thread.communityId,
  });
  return (
    <div className="ThreadCell">
      <div className="card-image-container">
        <ReactionButton
          thread={thread}
          size="big"
          disabled={false}
          undoUpvoteDisabled={false}
          tooltipText={
            typeof disabledActionsTooltipText === 'function'
              ? disabledActionsTooltipText?.('upvote')
              : disabledActionsTooltipText ||
                (typeof disabledReactPermissionTooltipText === 'function'
                  ? disabledReactPermissionTooltipText?.('upvote')
                  : disabledReactPermissionTooltipText) ||
                (typeof disabledCommentPermissionTooltipText === 'function'
                  ? disabledCommentPermissionTooltipText?.('upvote')
                  : disabledCommentPermissionTooltipText) ||
                'upvote'
          }
        />
        <img src={image[0] || threadPlaceholder} alt="Thread content" />
        <div className="thread-details">
          <div className="content-title">
            <CWText type="h5" fontWeight="semiBold" noWrap>
              <ThreadContestTagContainer
                associatedContests={thread.associatedContests}
              />
              {thread.title}
            </CWText>
            <NewThreadTag threadCreatedAt={moment(thread.createdAt)} />
            {showTag && (
              <CWTag iconName="trendUp" label="Trending" type="trending" />
            )}
          </div>
          <div className="community-details">
            {fetchedCommunity && fetchedCommunity.icon_url && (
              <img src={fetchedCommunity.icon_url} alt="community Icon" />
            )}
            <CWText fontWeight="bold">{fetchedCommunity?.name}</CWText>
          </div>
          <div className="thread-body">
            <MarkdownViewerWithFallback
              markdown={threadBody}
              maxChars={70}
              cutoffLines={1}
              className="capital"
            />
          </div>

          <div className="footer-container">
            <CWThreadAction
              label={pluralize(thread.numberOfComments, 'Comment')}
              action="comment"
              disabled={false}
              onClick={(e) => {
                e.preventDefault();
              }}
              tooltipText="comment"
            />
            <SharePopover linkToShare={shareEndpoint} buttonLabel="Share" />
            {user.id > 0 && (
              <ToggleThreadSubscribe
                thread={thread}
                isCommunityMember={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadCell;
