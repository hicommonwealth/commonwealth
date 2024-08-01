import { ForumActions } from '@hicommonwealth/schemas';
import { useRefreshMembershipQuery } from '../state/api/groups';

type UseAllowedGroupsParams = {
  communityId: string;
  address: string;
  topicId?: number;
};

export type UseForumActionGatedResponse = Map<number, ForumActions[]>;

export const useForumActionGated = ({
  communityId,
  address,
  topicId,
}: UseAllowedGroupsParams[]): UseForumActionGatedResponse => {
  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId,
    address,
    topicId,
    apiEnabled: !!address,
  });

  if (memberships.length === 0) {
    return new Map();
  }

  const flatMemberships = memberships.flatMap((m) =>
    m.topicIds.map((t) => ({
      topic_id: t,
      allowedActions: m.allowedActions,
    })),
  );

  const topicIdToIsAllowedMap: Map<number, ForumActions[]> = new Map(
    flatMemberships.map((g) => [g.topic_id, g.allowedActions]),
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
      Array.from(new Set([...oldAllowList, ...value])),
    );
  });

  return topicIdToIsAllowedMap;
};
