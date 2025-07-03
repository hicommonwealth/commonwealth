import { ActionGroups, GatedActionEnum } from '@hicommonwealth/shared';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useGetMembershipsQuery } from '../state/api/groups/getMemberships';
import Permissions from '../utils/Permissions';

type UseTopicGatingProps = {
  communityId: string;
  apiEnabled: boolean;
  userAddress: string;
  topicId?: number;
  actions?: GatedActionEnum[];
};

const useTopicGating = ({
  actions = Object.values(GatedActionEnum) as GatedActionEnum[],
  apiEnabled,
  communityId,
  userAddress,
  topicId,
}: UseTopicGatingProps) => {
  const { data: groups = [], isLoading: isLoadingGroups } = useFetchGroupsQuery(
    {
      communityId,
      includeTopics: true,
      includeMembers: true,
      enabled: !!communityId,
    },
  );

  const { data: memberships = [], isLoading: isLoadingMemberships } =
    useGetMembershipsQuery({
      community_id: communityId,
      address: userAddress,
      enabled: apiEnabled && !!userAddress,
    });

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  if (!topicId)
    return {
      groups,
      memberships,
      isLoadingMemberships,
      isLoadingGroups,
      isLoading: isLoadingGroups || isLoadingMemberships,
      isTopicGated: false,
      bypassGating: isAdmin,
      actionGroups: {},
    };

  // Build a map of groupId -> isMember from memberships
  const membershipMap = new Map<number, boolean>();
  memberships?.forEach((m) => {
    membershipMap.set(m.groupId, m.isAllowed);
  });

  const actionsSet = new Set(actions);

  // stores group ids of groups that have gated actions for current topic
  const topicGroupSet = new Set<number>([]);

  // stores groups (by action) that:
  //  - are relevant to the current topic
  //  - have a gated actions that match the given actions (e.g. CREATE_THREAD)
  //  - the user is not a member of
  //
  // Example: { CREATE_THREAD: { 1: 'ETH holders' }, CREATE_COMMENT: { 5: 'Eth Whales' } }
  const actionGroups: ActionGroups = {};

  for (const group of groups) {
    for (const topic of group.topics) {
      if (topic.id === topicId) {
        const topicActions = new Set(topic.permissions);
        if (topicActions.size > 0) topicGroupSet.add(group.id);
        const intersection = actionsSet.intersection(topicActions);
        if (intersection.size > 0 && !membershipMap.get(group.id)) {
          for (const action of intersection) {
            if (!actionGroups[action]) {
              actionGroups[action] = { [group.id]: group.name };
            }
            if (!actionGroups[action][group.id])
              actionGroups[action][group.id] = group.name;
          }
        }
        break;
      }
    }
  }

  return {
    groups,
    memberships,
    isLoadingMemberships,
    isLoadingGroups,
    isLoading: isLoadingGroups || isLoadingMemberships,
    // true if the topic is associated with one or more groups that have gated actions
    isTopicGated: topicGroupSet.size > 0,
    // boolean indicating whether gating should be bypassed
    bypassGating: isAdmin,
    actionGroups,
  };
};

export default useTopicGating;
