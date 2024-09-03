import { ForumActions, ForumActionsEnum } from '@hicommonwealth/schemas';
import { useRefreshMembershipQuery } from '../state/api/groups';

type UseAllowedGroupsParams = {
  communityId: string;
  address: string;
  topicId?: number;
  isAdmin: boolean;
};

export type UseForumActionGatedResponse = {
  canCreateThread: boolean;
  canCreateComment: boolean;
  canReactToThread: boolean;
  canReactToComment: boolean;
  canUpdatePoll: boolean;
};

export const useForumActionGated = ({
  communityId,
  address,
  topicId,
  isAdmin,
}: UseAllowedGroupsParams): UseForumActionGatedResponse => {
  const allowEverything = {
    canCreateThread: true,
    canCreateComment: true,
    canReactToThread: true,
    canReactToComment: true,
    canUpdatePoll: true,
  };

  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId,
    address,
    topicId: topicId?.toString(),
    apiEnabled: !!address,
  });

  if (memberships.length === 0) {
    return allowEverything;
  }

  const flatMemberships = memberships
    .flatMap((m) =>
      m.topicIds.map((t) => ({
        topic_id: t,
        allowedActions: m.allowedActions,
      })),
    )
    .map((g) => [g.topic_id, g.allowedActions]) as unknown as [
    number,
    ForumActions[],
  ][];

  const topicIdToIsAllowedMap: Map<number, ForumActions[]> = new Map(
    flatMemberships,
  );

  // Each map entry represents a topic and associated forumActions they are allowed to perform. We want to find for
  // each topic, the set union of all associated forumActions to get the actions that the address can perform.
  topicIdToIsAllowedMap.forEach((value, key) => {
    const oldAllowList = topicIdToIsAllowedMap.get(key);
    if (!oldAllowList) {
      topicIdToIsAllowedMap.set(key, Array.from(new Set(value)));
    }
    topicIdToIsAllowedMap.set(
      key,
      Array.from(new Set([...(oldAllowList as []), ...(value as [])])),
    );
  });

  const allowedActionsForTopic = topicIdToIsAllowedMap.get(topicId ?? 0);
  if (isAdmin || !topicId || !allowedActionsForTopic) {
    return allowEverything;
  }

  return {
    canCreateThread: allowedActionsForTopic.includes(
      ForumActionsEnum.CREATE_THREAD,
    ),
    canCreateComment: allowedActionsForTopic.includes(
      ForumActionsEnum.CREATE_COMMENT,
    ),
    canReactToThread: allowedActionsForTopic.includes(
      ForumActionsEnum.CREATE_THREAD_REACTION,
    ),
    canReactToComment: allowedActionsForTopic.includes(
      ForumActionsEnum.CREATE_COMMENT_REACTION,
    ),
    canUpdatePoll: allowedActionsForTopic.includes(
      ForumActionsEnum.UPDATE_POLL,
    ),
  };
};
