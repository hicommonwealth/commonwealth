import { PermissionEnum } from '@hicommonwealth/schemas';
import { MAIDEN_CHARS_TO_SHOW_MORE, slugify } from '@hicommonwealth/shared';
import { extractImages } from 'client/scripts/helpers/feed';
import { getThreadActionTooltipText } from 'client/scripts/helpers/threads';
import { getProposalUrlPath } from 'client/scripts/identifiers';
import Thread from 'client/scripts/models/Thread';
import { Memberships } from 'client/scripts/state/api/groups/refreshMembership';
import useUserStore from 'client/scripts/state/ui/user';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import Permissions from 'utils/Permissions';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';
import { checkIsTopicInContest } from '../../components/NewThreadFormLegacy/helpers';
import { ThreadCard } from './ThreadCard';

type TopicPermission = { id: number; permissions: PermissionEnum[] };

type contestsData = {
  all: Contest[];
  finished: Contest[];
  active: Contest[];
};
export type RenderThreadCardProps = {
  thread: Thread;
  isCardView?: boolean;
  hideThreadOptions?: boolean;
  hidePublishDate?: boolean;
  hideTrendingTag?: boolean;
  hideSpamTag?: boolean;
  communityId: string;
  memberships?: Memberships[];
  topicPermissions?: TopicPermission[];
  contestsData: contestsData;
};

export const RenderThreadCard = ({
  thread,
  isCardView,
  hidePublishDate,
  hideSpamTag,
  hideTrendingTag,
  communityId,
  memberships,
  topicPermissions,
  contestsData,
}: RenderThreadCardProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const discussionLink = getProposalUrlPath(
    thread.slug,
    `${thread.identifier}-${slugify(thread.title)}`,
  );

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

  const isThreadTopicInContest = checkIsTopicInContest(
    contestsData?.all,
    thread?.topic?.id,
  );

  const images = isCardView && extractImages(thread?.body);

  return (
    <ThreadCard
      key={thread?.id + '-' + thread.readOnly}
      thread={thread}
      canReact={
        disabledReactPermissionTooltipText
          ? !disabledReactPermissionTooltipText
          : !disabledActionsTooltipText
      }
      canComment={
        disabledCommentPermissionTooltipText
          ? !disabledCommentPermissionTooltipText
          : !disabledActionsTooltipText
      }
      onEditStart={() => navigate(`${discussionLink}?isEdit=true`)}
      onStageTagClick={() => {
        navigate(`/discussions?stage=${thread.stage}`);
      }}
      threadHref={`${getScopePrefix()}${discussionLink}`}
      onBodyClick={() => {
        const scrollEle = document.getElementsByClassName('Body')[0];
        localStorage[`${communityId}-discussions-scrollY`] =
          scrollEle.scrollTop;
      }}
      onCommentBtnClick={() => navigate(`${discussionLink}?focusComments=true`)}
      disabledActionsTooltipText={
        disabledCommentPermissionTooltipText ||
        disabledReactPermissionTooltipText ||
        disabledActionsTooltipText
      }
      hideRecentComments
      editingDisabled={isThreadTopicInContest}
      threadImage={images && isCardView && images.length ? images[0] : null}
      isCardView={isCardView}
      hidePublishDate={hidePublishDate}
      hideTrendingTag={hideTrendingTag}
      hideSpamTag={hideSpamTag}
      cutoffLines={6}
      maxChars={MAIDEN_CHARS_TO_SHOW_MORE}
    />
  );
};
