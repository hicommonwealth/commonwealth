import { PermissionEnum } from '@hicommonwealth/schemas';
import { slugify } from '@hicommonwealth/shared';
import { getThreadActionTooltipText } from 'client/scripts/helpers/threads';
import useTopicGating from 'client/scripts/hooks/useTopicGating';
import { getProposalUrlPath } from 'client/scripts/identifiers';
import Thread from 'client/scripts/models/Thread';
import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { useFetchCustomDomainQuery } from 'client/scripts/state/api/configuration';
import useUserStore from 'client/scripts/state/ui/user';
import React from 'react';
import Permissions from '../../../../scripts/utils/Permissions';
import { ThreadCard } from '../../pages/discussions/ThreadCard';

import './ThreadPreviewModal.scss';

type ThreadModalProps = {
  thread: Thread;
};

export const ThreadModal = ({ thread }: ThreadModalProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();

  const discussionLink = getProposalUrlPath(
    thread?.slug,
    `${thread?.identifier}-${slugify(thread.title)}`,
    false,
    thread?.communityId,
  );
  const { data: community } = useGetCommunityByIdQuery({
    id: thread.communityId,
    enabled: !!thread.communityId,
  });

  const account = user.addresses?.find(
    (a) => a?.community?.id === thread?.communityId,
  );

  const { isRestrictedMembership, foundTopicPermissions } = useTopicGating({
    communityId: thread.communityId,
    userAddress: account?.address || '',
    apiEnabled: !!account?.address && !!thread.communityId,
    topicId: thread?.topic?.id || 0,
  });

  const isAdmin =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin({
      id: community?.id || '',
      adminsAndMods: community?.adminsAndMods || [],
    });

  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: Permissions.isCommunityMember(thread.communityId),
    isThreadArchived: !!thread?.archivedAt,
    isThreadLocked: !!thread?.lockedAt,
    isThreadTopicGated: isRestrictedMembership,
  });

  const disabledCommentActionTooltipText = getThreadActionTooltipText({
    isCommunityMember: Permissions.isCommunityMember(thread.communityId),
    threadTopicInteractionRestrictions:
      !isAdmin &&
      !foundTopicPermissions?.permissions?.includes(
        PermissionEnum.CREATE_COMMENT, // on this page we only show comment option
      )
        ? foundTopicPermissions?.permissions
        : undefined,
  });

  // edge case for deleted communities with orphaned posts
  if (!community) {
    return (
      <ThreadCard thread={thread} layoutType="community-first" showSkeleton />
    );
  }

  return (
    <ThreadCard
      thread={thread}
      canReact={!disabledActionsTooltipText}
      canComment={!disabledCommentActionTooltipText}
      canUpdateThread={false} // we dont want user to update thread from here, even if they have permissions
      onStageTagClick={() => {
        navigate(
          `${
            domain?.isCustomDomain ? '' : `/${thread.communityId}`
          }/discussions?stage=${thread.stage}`,
        );
      }}
      threadHref={discussionLink}
      onCommentBtnClick={() => navigate(`${discussionLink}?focusComments=true`)}
      disabledActionsTooltipText={
        disabledCommentActionTooltipText
          ? disabledCommentActionTooltipText
          : disabledActionsTooltipText
      }
      customStages={community.custom_stages}
      hideReactionButton
      hideUpvotesDrawer
      layoutType="author-first"
      showCommentState
      removeImagesFromMarkDown
    />
  );
};
